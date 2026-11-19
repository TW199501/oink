#import <AppKit/AppKit.h>

// Called on the process main thread before the WebView (or from the backend
// main queue when the nested UI bundle itself could not be opened).
int oink_startup_alert(int screen, int lang, int exitCode, const char *detail, const char *version, const char *logs) {
    @autoreleasepool {
        NSApplication *app = NSApplication.sharedApplication;
// lang: 0 English, 1 Simplified Chinese, 2 Traditional Chinese.
#define L(c, t, e) (lang == 1 ? @c : lang == 2 ? @t : @e)
        NSAlert *alert = [[NSAlert alloc] init];
        NSArray<NSString *> *buttons;
        NSString *reason = @(detail);
        NSURL *logURL = [NSURL fileURLWithPath:@(logs) isDirectory:YES];
        switch (screen) {
            case 8:
                alert.messageText = L("请先把 Oink 拖到「应用程序」文件夹", "請先把 Oink 拖到「應用程式」資料夾", "Move Oink to the Applications folder first");
                alert.informativeText = L("Oink 现在是从安装盘或下载位置直接打开的，在这里无法正常运行。请把 Oink 拖到「应用程序」文件夹，再从那里打开。", "Oink 目前是直接從安裝磁碟映像檔或下載位置打開的，在這裡無法正常執行。請把 Oink 拖到「應用程式」資料夾，再從那裡打開。", "Oink was opened straight from the disk image or download location and can't run properly from there. Drag Oink to the Applications folder, then open it from there.");
                buttons = @[L("打开「应用程序」文件夹", "打開「應用程式」資料夾", "Open Applications Folder"), L("退出", "結束", "Quit")];
                break;
            case 9:
                alert.messageText = L("另一个版本的 Oink 正在运行", "另一個版本的 Oink 正在執行", "Another version of Oink is running");
                alert.informativeText = [NSString stringWithFormat:L("正在运行的是 Oink %@，你打开的是 %@。要使用这个版本，请先退出正在运行的那个。", "正在執行的是 Oink %@，你打開的是 %@。要使用這個版本，請先結束正在執行的那個。", "Oink %@ is already running, and you opened %@. To use this version, quit the running one first."), reason, @(version)];
                buttons = @[L("退出它", "結束它", "Quit It"), L("取消", "取消", "Cancel")];
                break;
            case 10:
                alert.messageText = L("Oink 安装不完整", "Oink 安裝不完整", "Oink isn't fully installed");
                alert.informativeText = L("Oink 缺少运行所需的文件，可能是复制或更新时中断了。请重新下载并安装 Oink。", "Oink 缺少執行所需的檔案，可能是複製或更新時中斷了。請重新下載並安裝 Oink。", "Some files Oink needs are missing. Copying or updating may have been interrupted. Please download and install Oink again.");
                buttons = @[L("重新下载安装", "重新下載安裝", "Download Again"), L("退出", "結束", "Quit")];
                break;
            default: {
                alert.messageText = L("Oink 后台没能启动", "Oink 背景服務無法啟動", "Oink's background process couldn't start");
                alert.informativeText = L("请先点「重试」。如果反复出现，请复制诊断信息发给我们。", "請先按「重試」。如果反覆出現，請複製診斷資訊傳給我們。", "Click Retry first. If it keeps happening, copy the diagnostic info and send it to us.");
                buttons = @[L("重试", "重試", "Retry"), L("打开日志文件夹", "打開記錄檔資料夾", "Open Log Folder"), L("复制诊断信息", "複製診斷資訊", "Copy Diagnostic Info"), L("退出", "結束", "Quit")];
                NSString *summary = lang != 0 && exitCode >= 0 ? [NSString stringWithFormat:L("oink-backend 已退出，退出码 %d", "oink-backend 已結束，結束代碼 %d", "%d"), exitCode] : reason;
                NSTextField *label = [NSTextField wrappingLabelWithString:[L("技术详情：", "技術詳情：", "Technical details: ") stringByAppendingString:summary]];
                label.font = [NSFont systemFontOfSize:11];
                label.textColor = NSColor.secondaryLabelColor;
                label.preferredMaxLayoutWidth = 240;
                label.frame = NSMakeRect(0, 0, 240, label.fittingSize.height);
                alert.accessoryView = label;
                break;
            }
        }
        for (NSString *title in buttons) [alert addButtonWithTitle:title];
        alert.buttons.lastObject.keyEquivalent = @"\033";
        // A helper reached before Tauri initializes NSApplication may still
        // have Prohibited policy. Accessory permits a key modal without
        // introducing a Dock icon or main application window.
        if (app.activationPolicy == NSApplicationActivationPolicyProhibited)
            [app setActivationPolicy:NSApplicationActivationPolicyAccessory];
        if (!app.isRunning) [app finishLaunching];
        [app activateIgnoringOtherApps:YES];
        for (;;) {
            NSInteger choice = [alert runModal] - NSAlertFirstButtonReturn;
            if (choice == 0 && screen == 8)
                [NSWorkspace.sharedWorkspace openURL:[NSURL fileURLWithPath:@"/Applications" isDirectory:YES]];
            else if (choice == 0 && screen == 10)
                [NSWorkspace.sharedWorkspace openURL:[NSURL URLWithString:@"https://github.com/oinkvm/oink/releases/latest"]];
            else if (choice == 1 && screen == 11) {
                [NSWorkspace.sharedWorkspace openURL:logURL];
                continue;
            } else if (choice == 2 && screen == 11) {
                NSString *text = [NSString stringWithFormat:@"Oink %@\nmacOS %@\n%@\nLogs: %@", @(version), NSProcessInfo.processInfo.operatingSystemVersionString, reason, logURL.path];
                [NSPasteboard.generalPasteboard clearContents];
                [NSPasteboard.generalPasteboard setString:text forType:NSPasteboardTypeString];
                continue;
            }
            return choice == 0 && (screen == 9 || screen == 11);
        }
    }
}

// LaunchServices gives the outer bundle its own application identity and
// responsibility. An "open" subprocess would only report the request's status.
// Keep the returned NSRunningApplication to detect death before IPC publication.
void *oink_launch_background(const char *bundle, const char *home, const char *reply, char **failure) {
    NSWorkspaceOpenConfiguration *config = [NSWorkspaceOpenConfiguration configuration];
    config.createsNewApplicationInstance = YES;
    config.activates = NO;
    config.promptsUserIfNeeded = NO;
    config.arguments = @[@"--ui-start-backend", @(reply)];
    config.environment = @{@"OINK_HOME": @(home)};
    __block NSRunningApplication *process;
    __block NSError *reason;
    __block BOOL done = NO;
    [NSWorkspace.sharedWorkspace openApplicationAtURL:[NSURL fileURLWithPath:@(bundle)]
        configuration:config completionHandler:^(NSRunningApplication *app, NSError *error) {
            dispatch_async(dispatch_get_main_queue(), ^{
                process = app;
                reason = error;
                done = YES;
            });
        }];
    while (!done) [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.05]];
    if (!process) {
        *failure = strdup(reason.description.UTF8String ?: "LaunchServices returned no application");
        return NULL;
    }
    return (__bridge_retained void *)process;
}

bool oink_launch_exited(void *process) {
    // Termination state is refreshed on the main run loop.
    [NSRunLoop.currentRunLoop runUntilDate:[NSDate dateWithTimeIntervalSinceNow:0.01]];
    return ((__bridge NSRunningApplication *)process).terminated;
}

void oink_release_launch(void *process) { CFRelease(process); }
