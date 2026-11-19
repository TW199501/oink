import { useEffect, useState } from 'react';
import { Button, EmptyState, Icon, OinkProvider, Spinner, Toaster, toast } from 'oink-ui';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { startupKind, startupMessages } from '../i18n/problems';
import { useLanguage, tr } from '../i18n';
import { shell } from '../api/client';
import { transport } from '../api/transport';
import { PauseGlyph } from '../devices/icons';
import { version } from '../version';
import { DesktopWindow } from './DesktopWindow';
import { ResizeEdges } from './ResizeEdges';
import { revealWhenReady } from './ready';

export function StartupPanel({ raw }: { raw: string }) {
  const kind = startupKind(raw);
  const language = useLanguage();
  const pick = (hans: string, hant: string, en: string) => language === 'zh-Hans' ? hans : language === 'zh-Hant' ? hant : en;
  const [titleZh, titleEn, descZh, descEn, titleTw, descTw] = startupMessages[kind];
  const [details, setDetails] = useState<string | null>(null);
  const diagnostic = async () => {
    const latest = await transport.shell<string>('startup_details');
    return [`Oink ${version}`, kind, raw, latest].join('\n');
  };
  const run = (action: () => Promise<unknown>) => void action().catch(() => toast.danger({title: pick('操作失败', '操作失敗', 'Action failed')}));
  const retry = ['stopped','disabled','session','update','exited'].includes(kind);
  const download = kind === 'missing' || kind === 'update';
  return <div className="boot-wrap"><div className="boot-content">
    <EmptyState className="boot" data-tone={kind} icon={kind === 'waiting' ? <Spinner/> : kind === 'rdp' ? <PauseGlyph/> : <Icon name={kind === 'session' ? 'user' : kind === 'update' ? 'refresh' : 'alert'}/>}
      title={pick(titleZh, titleTw, titleEn)} description={pick(descZh, descTw, descEn)} actions={<>
        {download && <Button variant="accent" onClick={() => run(() => shell.openUrl('https://github.com/oinkvm/oink/releases/latest'))}><Icon name="download"/>{pick('下载安装包', '下載安裝程式', 'Download installer')}</Button>}
        {retry && <Button variant={download ? undefined : 'accent'} onClick={() => run(() => transport.shell('startup_retry'))}>{pick('重试', '重試', 'Retry')}</Button>}
        {(kind === 'disabled' || kind === 'stopped') && <Button onClick={() => run(() => transport.shell('startup_open_services'))}>{pick('打开「服务」', '開啟「服務」', 'Open Services')}</Button>}
      </>}/>
    <div className="boot__tools">
      <Button size="sm" variant="ghost" onClick={() => run(async () => { await navigator.clipboard.writeText(await diagnostic()); toast.success({title:pick('诊断信息已复制', '已複製診斷資訊', 'Diagnostic info copied')}); })}><Icon name="copy"/>{pick('复制诊断信息', '複製診斷資訊', 'Copy diagnostic info')}</Button>
      <Button size="sm" variant="ghost" onClick={() => run(() => transport.shell('startup_open_logs'))}><Icon name="folder"/>{pick('打开日志文件夹', '開啟記錄檔資料夾', 'Open log folder')}</Button>
      <Button size="sm" variant="ghost" aria-expanded={details !== null} onClick={() => run(async () => setDetails(details === null ? await diagnostic() : null))}>{pick('技术详情', '技術詳情', 'Technical details')}<Icon name={details === null ? 'chevron-down' : 'chevron-up'}/></Button>
    </div>{details !== null && <pre className="boot__details">{details}</pre>}
  </div></div>;
}

export function StartupWindow({raw}: {raw: string}) {
  const language = useLanguage();
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  useEffect(() => revealWhenReady(() => void shell.ready()), []);
  return <OinkProvider locale={language === 'zh-Hans' ? 'zh-CN' : 'en-US'}><div className="oink-app" data-view="main" data-platform="win">
    <div className="win-shadow" aria-hidden="true"><div className="win-shadow__shape"/></div>
    <DesktopWindow ref={setContainer} platform="win" state={{maximized:false,minimized:false,closed:false}} active title={tr('显示器排列')}
      onMinimize={() => void getCurrentWindow().minimize()} onToggleMaximize={() => void getCurrentWindow().toggleMaximize()} onClose={() => void shell.close()}
      onActivate={() => {}} navOpen={false} nav={() => null} onToggleNav={() => {}} onSideAction={action => { if (action === 'quit') void shell.quit(); }} version={version}>
      <div className="disp"><div className="disp__canvas"><StartupPanel key={raw} raw={raw}/></div></div>
    </DesktopWindow><ResizeEdges platform="win"/>{container && <Toaster container={container}/>}
  </div></OinkProvider>;
}
