import { useState, useEffect, useCallback, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { GitFork, Download, AlertCircle, Star, ExternalLink, Loader2, Terminal as TerminalIcon, RefreshCw } from 'lucide-react';
import { usePaneLogo } from '../hooks/usePaneLogo';
import { Modal, ModalBody, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import { capture } from '../services/posthog';
import { API } from '../utils/api';
import { panelApi } from '../services/panelApi';
import { useNavigationStore } from '../stores/navigationStore';
import { useSessionStore } from '../stores/sessionStore';
import { getTerminalTheme } from '../utils/terminalTheme';
import type { Project } from '../types/project';
import '@xterm/xterm/css/xterm.css';

type DialogStep = 'detecting' | 'ready';

interface EnvironmentInfo {
  gitInstalled: boolean;
  ghInstalled: boolean;
  ghAuthenticated: boolean;
  ghReady: boolean;
  ghScopes: string[];
  requiredGhScopes: string[];
  missingGhScopes: string[];
  ghAuthCommand?: string;
  ghInstallUrl: string;
}

interface GitHubAuthCommandResult {
  command: string;
  reason: 'login' | 'refresh' | 'install-gh' | 'ready';
}

interface GitHubAuthTerminalStartResult extends GitHubAuthCommandResult {
  terminalId: string;
  cols: number;
  rows: number;
}

interface GitHubAuthTerminalExit {
  terminalId: string;
  exitCode: number;
  signal: number | null;
}

interface OnboardingDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GitHubAuthSetupTerminalProps {
  active: boolean;
  runKey: number;
  onStarted: (result: GitHubAuthTerminalStartResult) => void;
  onExit: (result: GitHubAuthTerminalExit) => void;
  onError: (message: string) => void;
}

const GITHUB_CLI_URL = 'https://cli.github.com/';
const GITHUB_AUTH_POLL_INTERVAL_MS = 3000;
const GITHUB_AUTH_POLL_TIMEOUT_MS = 5 * 60 * 1000;

function fallbackEnvironment(): EnvironmentInfo {
  return {
    gitInstalled: false,
    ghInstalled: false,
    ghAuthenticated: false,
    ghReady: false,
    ghScopes: [],
    requiredGhScopes: ['user'],
    missingGhScopes: ['user'],
    ghInstallUrl: GITHUB_CLI_URL,
  };
}

function normalizeEnvironment(value: Partial<EnvironmentInfo> | null | undefined): EnvironmentInfo {
  const fallback = fallbackEnvironment();
  return {
    ...fallback,
    ...value,
    ghScopes: Array.isArray(value?.ghScopes) ? value.ghScopes : fallback.ghScopes,
    requiredGhScopes: Array.isArray(value?.requiredGhScopes) ? value.requiredGhScopes : fallback.requiredGhScopes,
    missingGhScopes: Array.isArray(value?.missingGhScopes) ? value.missingGhScopes : fallback.missingGhScopes,
    ghInstallUrl: value?.ghInstallUrl || fallback.ghInstallUrl,
  };
}

function GitHubAuthSetupTerminal({ active, runKey, onStarted, onExit, onError }: GitHubAuthSetupTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!active || !containerRef.current) return;

    let disposed = false;
    let outputCleanup: (() => void) | null = null;
    let exitCleanup: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: number | null = null;

    const terminal = new XTerm({
      cursorBlink: true,
      convertEol: true,
      disableStdin: false,
      fontFamily: '"Geist Mono", "Symbols Nerd Font Mono", monospace',
      fontSize: 12,
      lineHeight: 1.2,
      scrollback: 1000,
      theme: getTerminalTheme(),
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(containerRef.current);

    const fitTerminal = () => {
      try {
        fitAddon.fit();
        const dimensions = fitAddon.proposeDimensions();
        const terminalId = terminalIdRef.current;
        if (terminalId && dimensions) {
          void window.electronAPI.onboarding.resizeGitHubAuthTerminal(terminalId, dimensions.cols, dimensions.rows);
        }
      } catch {
        // Ignore transient zero-size layout states while the modal is animating.
      }
    };

    const scheduleFit = () => {
      if (resizeTimer) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(fitTerminal, 50);
    };

    outputCleanup = window.electronAPI.onboarding.onGitHubAuthTerminalOutput((payload) => {
      if (payload.terminalId === terminalIdRef.current) {
        terminal.write(payload.data);
      }
    });

    exitCleanup = window.electronAPI.onboarding.onGitHubAuthTerminalExit((payload) => {
      if (payload.terminalId === terminalIdRef.current) {
        onExit(payload);
      }
    });

    const inputDisposable = terminal.onData((data) => {
      const terminalId = terminalIdRef.current;
      if (terminalId) {
        void window.electronAPI.onboarding.writeGitHubAuthTerminal(terminalId, data);
      }
    });

    resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(containerRef.current);

    const startTerminal = async () => {
      try {
        fitAddon.fit();
        const dimensions = fitAddon.proposeDimensions();
        const response = await window.electronAPI.onboarding.startGitHubAuthTerminal(
          dimensions?.cols ?? 80,
          dimensions?.rows ?? 18,
        );

        if (disposed) return;

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to start GitHub CLI setup terminal');
        }

        const data = response.data as GitHubAuthTerminalStartResult;
        terminalIdRef.current = data.terminalId;
        terminal.write(`\x1b[90m$ ${data.command}\x1b[0m\r\n`);
        terminal.focus();
        onStarted(data);
        fitTerminal();
      } catch (error) {
        if (!disposed) {
          onError(error instanceof Error ? error.message : 'Failed to start GitHub CLI setup terminal');
        }
      }
    };

    void startTerminal();

    return () => {
      disposed = true;
      if (resizeTimer) window.clearTimeout(resizeTimer);
      outputCleanup?.();
      exitCleanup?.();
      resizeObserver?.disconnect();
      inputDisposable.dispose();
      const terminalId = terminalIdRef.current;
      terminalIdRef.current = null;
      if (terminalId) {
        void window.electronAPI.onboarding.killGitHubAuthTerminal(terminalId);
      }
      terminal.dispose();
    };
  }, [active, runKey, onStarted, onExit, onError]);

  return (
    <div className="pane-onboarding-auth-terminal rounded-md border border-border-primary bg-[var(--color-terminal-bg)] overflow-hidden">
      <div ref={containerRef} className="h-64 w-full" />
    </div>
  );
}

export default function OnboardingDialog({ isOpen, onClose }: OnboardingDialogProps) {
  const paneLogo = usePaneLogo();
  const activeProjectId = useNavigationStore(s => s.activeProjectId);
  const navigateToSessions = useNavigationStore(s => s.navigateToSessions);
  const setActiveSession = useSessionStore(s => s.setActiveSession);
  const [step, setStep] = useState<DialogStep>('detecting');
  const [env, setEnv] = useState<EnvironmentInfo | null>(null);
  const [shouldSupportOnSetup, setShouldSupportOnSetup] = useState(true);
  const [showSupportPopover, setShowSupportPopover] = useState(false);
  const [showOptOutConfirm, setShowOptOutConfirm] = useState(false);
  const [githubSetupStarted, setGithubSetupStarted] = useState(false);
  const [githubSetupBusy, setGithubSetupBusy] = useState(false);
  const [githubSetupMessage, setGithubSetupMessage] = useState<string | null>(null);
  const [githubSetupError, setGithubSetupError] = useState<string | null>(null);
  const [manualCommand, setManualCommand] = useState<string | null>(null);
  const [githubSetupTimedOut, setGithubSetupTimedOut] = useState(false);
  const [showGitHubAuthTerminal, setShowGitHubAuthTerminal] = useState(false);
  const [githubAuthTerminalRunKey, setGitHubAuthTerminalRunKey] = useState(0);

  const markOnboardingComplete = async () => {
    try {
      if (window.electron?.invoke) {
        await window.electron.invoke('preferences:set', 'onboarding_repo_setup', 'true');
      }
    } catch {
      // Ensure dialog closes even if preference write fails
    }
  };

  const detectEnvironment = useCallback(async (options?: { showLoading?: boolean }): Promise<EnvironmentInfo> => {
    if (options?.showLoading !== false) {
      setStep('detecting');
    }

    try {
      const result = await window.electronAPI.onboarding.detectEnvironment();
      if (result.success && result.data) {
        const nextEnv = normalizeEnvironment(result.data as Partial<EnvironmentInfo>);
        setEnv(nextEnv);
        setStep('ready');
        return nextEnv;
      }

      const nextEnv = fallbackEnvironment();
      setEnv(nextEnv);
      setStep('ready');
      return nextEnv;
    } catch {
      const nextEnv = fallbackEnvironment();
      setEnv(nextEnv);
      setStep('ready');
      return nextEnv;
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setGithubSetupStarted(false);
      setGithubSetupBusy(false);
      setGithubSetupMessage(null);
      setGithubSetupError(null);
      setManualCommand(null);
      setGithubSetupTimedOut(false);
      setShowGitHubAuthTerminal(false);
      void detectEnvironment();
      capture('onboarding_started');
    }
  }, [isOpen, detectEnvironment]);

  useEffect(() => {
    if (!isOpen || !githubSetupStarted || env?.ghReady) return;

    let cancelled = false;
    const startedAt = Date.now();

    const poll = async () => {
      const nextEnv = await detectEnvironment({ showLoading: false });
      if (cancelled) return;

      if (nextEnv.ghReady) {
        setGithubSetupStarted(false);
        setGithubSetupBusy(false);
        setGithubSetupTimedOut(false);
        setGithubSetupError(null);
        setGithubSetupMessage('GitHub CLI is ready.');
        setShowGitHubAuthTerminal(false);
        capture('onboarding_github_cli_ready');
        return;
      }

      if (Date.now() - startedAt > GITHUB_AUTH_POLL_TIMEOUT_MS) {
        setGithubSetupStarted(false);
        setGithubSetupBusy(false);
        setGithubSetupTimedOut(true);
        setGithubSetupMessage('Pane is no longer checking automatically. You can check again after finishing GitHub CLI setup.');
      }
    };

    const interval = window.setInterval(() => {
      void poll();
    }, GITHUB_AUTH_POLL_INTERVAL_MS);

    void poll();

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [isOpen, githubSetupStarted, env?.ghReady, detectEnvironment]);

  const getProjectIdForTerminal = useCallback(async (): Promise<number | null> => {
    if (activeProjectId) return activeProjectId;

    try {
      const activeResponse = await API.projects.getActive();
      const activeProject = activeResponse.data as Project | undefined;
      if (activeResponse.success && activeProject?.id) {
        return activeProject.id;
      }
    } catch {
      // Fall through to all-project lookup.
    }

    try {
      const projectsResponse = await API.projects.getAll();
      const projects = Array.isArray(projectsResponse.data) ? projectsResponse.data as Project[] : [];
      return projects.find(project => project.active)?.id ?? projects[0]?.id ?? null;
    } catch {
      return null;
    }
  }, [activeProjectId]);

  const openPaneTerminalWithCommand = useCallback(async (projectId: number, command: string) => {
    const sessionResponse = await API.sessions.getOrCreateMainRepoSession(projectId);
    if (!sessionResponse.success || !sessionResponse.data?.id) {
      throw new Error(sessionResponse.error || 'Failed to open a project terminal');
    }

    const sessionId = sessionResponse.data.id as string;
    const panel = await panelApi.createPanel({
      sessionId,
      type: 'terminal',
      title: 'GitHub Setup',
      initialState: {
        customState: {
          initialCommand: command,
        },
      },
    });

    await panelApi.setActivePanel(sessionId, panel.id);
    await setActiveSession(sessionId);
    navigateToSessions();
  }, [navigateToSessions, setActiveSession]);

  const getGitHubAuthCommand = useCallback(async (): Promise<GitHubAuthCommandResult> => {
    if (env?.ghAuthCommand) {
      return {
        command: env.ghAuthCommand,
        reason: env.ghAuthenticated ? 'refresh' : 'login',
      };
    }

    const response = await window.electronAPI.onboarding.getGitHubAuthCommand();
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to prepare GitHub CLI setup');
    }

    return response.data as GitHubAuthCommandResult;
  }, [env?.ghAuthCommand, env?.ghAuthenticated]);

  const handleGitHubSetup = async () => {
    setGithubSetupBusy(true);
    setGithubSetupStarted(true);
    setGithubSetupTimedOut(false);
    setGithubSetupError(null);
    setGithubSetupMessage('Waiting for GitHub CLI setup to finish...');

    try {
      const commandResult = await getGitHubAuthCommand();
      if (!commandResult.command) {
        if (commandResult.reason === 'ready') {
          await detectEnvironment({ showLoading: false });
          setGithubSetupStarted(false);
          setShowGitHubAuthTerminal(false);
          setGithubSetupMessage('GitHub CLI is ready.');
        } else {
          setGithubSetupStarted(false);
          setGithubSetupError('Install GitHub CLI, then check again.');
        }
        return;
      }

      setManualCommand(commandResult.command);
      const projectId = await getProjectIdForTerminal();

      if (projectId) {
        await openPaneTerminalWithCommand(projectId, commandResult.command);
        setGithubSetupMessage('GitHub CLI setup opened in Pane Terminal. Finish it there; Pane will keep checking.');
      } else {
        setShowGitHubAuthTerminal(true);
        setGitHubAuthTerminalRunKey(key => key + 1);
        setGithubSetupMessage('GitHub CLI setup is running below. Finish it here; Pane will keep checking.');
      }

      capture('onboarding_github_cli_setup_started', {
        reason: commandResult.reason,
        opened_pane_terminal: Boolean(projectId),
        opened_embedded_terminal: !projectId,
      });
    } catch (error) {
      setGithubSetupStarted(false);
      setShowGitHubAuthTerminal(false);
      setGithubSetupError(error instanceof Error ? error.message : 'Failed to start GitHub CLI setup');
    } finally {
      setGithubSetupBusy(false);
    }
  };

  const handleSetup = async () => {
    if (!env?.ghReady) {
      await handleGitHubSetup();
      return;
    }

    await markOnboardingComplete();
    onClose();

    if (shouldSupportOnSetup && env?.ghReady) {
      void window.electronAPI.onboarding.supportProject()
        .then((supportResult) => {
          if (supportResult?.success) {
            capture('onboarding_project_supported_during_setup');
          }
        })
        .catch(() => {
          // swallow: support failure is non-fatal
        });
    }

    void window.electronAPI.onboarding.setupDefaultRepo()
      .then((result) => {
        if (result.success) {
          window.dispatchEvent(new Event('project-changed'));
        } else {
          console.error('[Onboarding] Background setup failed:', result.error || 'Failed to set up project');
        }
      })
      .catch((error) => {
        console.error('[Onboarding] Background setup failed:', error);
      });
  };

  const handleSkip = async () => {
    capture('onboarding_skipped');
    await markOnboardingComplete();
    onClose();
  };

  const handleSupportCheckboxChange = (checked: boolean) => {
    if (!checked && shouldSupportOnSetup) {
      setShowSupportPopover(false);
      setShowOptOutConfirm(true);
      return;
    }

    setShouldSupportOnSetup(checked);
  };

  const handleKeepSupporting = () => {
    setShouldSupportOnSetup(true);
    setShowOptOutConfirm(false);
  };

  const handleConfirmOptOut = () => {
    setShouldSupportOnSetup(false);
    setShowOptOutConfirm(false);
  };

  const handleOpenGitGuide = () => {
    window.electronAPI.openExternal('https://git-scm.com/downloads');
  };

  const handleOpenGhGuide = () => {
    window.electronAPI.openExternal(env?.ghInstallUrl || GITHUB_CLI_URL);
  };

  const handleGitHubAuthTerminalStarted = useCallback((result: GitHubAuthTerminalStartResult) => {
    setManualCommand(result.command);
    setGithubSetupStarted(true);
    setGithubSetupBusy(false);
    setGithubSetupError(null);
    setGithubSetupMessage('GitHub CLI setup is running below. Finish it here; Pane will keep checking.');
  }, []);

  const handleGitHubAuthTerminalExit = useCallback((result: GitHubAuthTerminalExit) => {
    if (result.exitCode === 0) {
      setGithubSetupMessage('GitHub CLI setup finished. Checking readiness...');
      void detectEnvironment({ showLoading: false });
      return;
    }

    setGithubSetupStarted(false);
    setGithubSetupBusy(false);
    setGithubSetupError(`GitHub CLI setup exited with code ${result.exitCode}. You can run it again.`);
    setGithubSetupMessage(null);
  }, [detectEnvironment]);

  const handleGitHubAuthTerminalError = useCallback((message: string) => {
    setGithubSetupStarted(false);
    setGithubSetupBusy(false);
    setShowGitHubAuthTerminal(false);
    setGithubSetupError(message);
  }, []);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      size={showGitHubAuthTerminal ? 'xl' : 'md'}
      closeOnOverlayClick={false}
      closeOnEscape={false}
      showCloseButton={false}
    >
      {/* Header */}
      <div className="p-6 border-b border-border-primary">
        <div className="flex items-center">
          <img src={paneLogo} alt="Pane" className="h-10 w-10 mr-3" />
          <h1 className="text-lg font-semibold text-text-primary">Get Started with Pane</h1>
        </div>
      </div>

      <ModalBody className={step === 'ready' && env?.ghReady ? 'overflow-visible' : undefined}>
        {step === 'detecting' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 className="h-8 w-8 text-interactive animate-spin" />
            <p className="text-text-secondary">Checking your setup...</p>
          </div>
        )}

        {step === 'ready' && env && (
          <div className="space-y-4">
            {env.ghReady ? (
              <>
                <div className="flex items-start gap-3">
                  <GitFork className="h-6 w-6 text-interactive flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="text-text-primary font-medium">
                      Start developing with Pane as your first project
                    </p>
                    <p className="text-text-secondary text-sm">
                      We&apos;ll set up a real codebase so you&apos;re not staring at a blank screen.
                    </p>
                  </div>
                </div>
                <div
                  className="relative w-fit ml-9"
                  onMouseEnter={() => {
                    if (!showOptOutConfirm) setShowSupportPopover(true);
                  }}
                  onMouseLeave={() => setShowSupportPopover(false)}
                  onFocus={() => {
                    if (!showOptOutConfirm) setShowSupportPopover(true);
                  }}
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                      setShowSupportPopover(false);
                    }
                  }}
                >
                  {(showSupportPopover || showOptOutConfirm) && (
                    <div className="absolute left-0 bottom-full mb-3 w-80 z-30 rounded-lg border border-border-primary bg-surface-primary shadow-lg p-4">
                      {showOptOutConfirm ? (
                        <div className="space-y-3">
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-text-primary">Keep supporting independent development?</p>
                            <p className="text-xs leading-relaxed text-text-secondary">
                              Pane is built by Parsa, a self-funded developer, not a large corporation. A GitHub star for Pane and a follow are the easiest free way to support the project so it can keep growing.
                            </p>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={handleConfirmOptOut}>
                              Uncheck anyway
                            </Button>
                            <Button variant="primary" size="sm" onClick={handleKeepSupporting}>
                              Keep supporting
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <p className="text-sm font-semibold text-text-primary">Support Pane with a star and follow</p>
                          <p className="text-xs leading-relaxed text-text-secondary">
                            Pane is built by Parsa, a self-funded developer. A GitHub star for Pane and a follow are the easiest free way to support the project so it can keep growing.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer w-fit">
                    <input
                      type="checkbox"
                      checked={shouldSupportOnSetup}
                      onChange={(e) => handleSupportCheckboxChange(e.target.checked)}
                      className="rounded border-border-primary text-interactive focus:ring-interactive"
                    />
                    <Star className="h-3.5 w-3.5 text-text-secondary flex-shrink-0" />
                    <span className="text-text-secondary text-xs underline decoration-dotted underline-offset-2">
                      Help us keep building Pane independently
                    </span>
                  </label>
                </div>
              </>
            ) : !env.gitInstalled ? (
              <div className="flex items-start gap-3">
                <AlertCircle className="h-6 w-6 text-status-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-text-primary font-medium">
                    Git Required
                  </p>
                  <p className="text-text-secondary text-sm">
                    Git is required to use Pane. Please install Git and restart the application.
                  </p>
                </div>
              </div>
            ) : !env.ghInstalled ? (
              <div className="flex items-start gap-3">
                <Download className="h-6 w-6 text-interactive flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-text-primary font-medium">
                    GitHub CLI Required
                  </p>
                  <p className="text-text-secondary text-sm">
                    Configure GitHub CLI with the scopes required for Pane and your agents to work in Pane.
                  </p>
                  <Button onClick={() => void detectEnvironment()} variant="ghost" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>
                    Check again
                  </Button>
                </div>
              </div>
            ) : env.gitInstalled ? (
              <div className="flex items-start gap-3">
                <TerminalIcon className="h-6 w-6 text-interactive flex-shrink-0 mt-0.5" />
                <div className="space-y-3 min-w-0 w-full">
                  <p className="text-text-primary font-medium">
                    Connect GitHub for Pane
                  </p>
                  <p className="text-text-secondary text-sm">
                    Configure GitHub CLI with the scopes required for Pane and your agents to work in Pane.
                  </p>
                  {(githubSetupMessage || githubSetupStarted) && (
                    <div className="flex items-start gap-2 rounded border border-border-primary bg-surface-secondary px-3 py-2">
                      <Loader2 className={`h-4 w-4 mt-0.5 flex-shrink-0 text-interactive ${githubSetupStarted ? 'animate-spin' : ''}`} />
                      <p className="text-xs text-text-secondary">
                        {githubSetupMessage || 'Waiting for GitHub CLI setup to finish...'}
                      </p>
                    </div>
                  )}
                  {githubSetupTimedOut && (
                    <Button onClick={() => void detectEnvironment()} variant="secondary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>
                      Check again
                    </Button>
                  )}
                  {githubSetupError && (
                    <p className="text-xs text-status-error">
                      {githubSetupError}
                    </p>
                  )}
                  {showGitHubAuthTerminal && (
                    <GitHubAuthSetupTerminal
                      active={showGitHubAuthTerminal}
                      runKey={githubAuthTerminalRunKey}
                      onStarted={handleGitHubAuthTerminalStarted}
                      onExit={handleGitHubAuthTerminalExit}
                      onError={handleGitHubAuthTerminalError}
                    />
                  )}
                  {(manualCommand || env.ghAuthCommand) && !showGitHubAuthTerminal && (
                    <div className="rounded border border-border-primary bg-bg-secondary px-3 py-2 overflow-x-auto">
                      <code className="text-xs text-text-secondary whitespace-nowrap">
                        {manualCommand || env.ghAuthCommand}
                      </code>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              null
            )}
            {!env.ghReady && (
              <p className="text-xs text-text-secondary">
                You can skip for now, but {env.gitInstalled ? 'GitHub-powered' : 'Git and GitHub-powered'} functionality may not work until setup is complete.
              </p>
            )}
          </div>
        )}

      </ModalBody>

      <ModalFooter className="flex justify-between items-center">
        {step === 'detecting' && (
          <>
            <Button onClick={handleSkip} variant="ghost">Skip</Button>
            <div />
          </>
        )}

        {step === 'ready' && env && (
          <>
            <Button onClick={handleSkip} variant="ghost">Skip</Button>
            {env.ghReady ? (
              <Button onClick={handleSetup} variant="primary" icon={<GitFork className="h-4 w-4" />}>
                Let&apos;s go
              </Button>
            ) : !env.gitInstalled ? (
              <Button onClick={handleOpenGitGuide} variant="primary" icon={<ExternalLink className="h-4 w-4" />}>
                Install Git
              </Button>
            ) : !env.ghInstalled ? (
              <Button onClick={handleOpenGhGuide} variant="primary" icon={<ExternalLink className="h-4 w-4" />}>
                Install GitHub CLI
              </Button>
            ) : (
              <Button
                onClick={handleSetup}
                variant="primary"
                icon={<TerminalIcon className="h-4 w-4" />}
                loading={githubSetupBusy}
                loadingText="Opening"
              >
                Configure GitHub CLI
              </Button>
            )}
          </>
        )}

      </ModalFooter>
    </Modal>
  );
}
