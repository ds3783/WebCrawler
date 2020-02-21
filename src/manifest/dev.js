module.exports = {
    data: {
        type: 'development',

        server: {
        },
        screenshotPath: 'data/screenshot',
        captchaPath: 'data/captcha',
        cronJobDataPath: 'data/crondata',
        serverDesc: 'Nestia Web Server V1.0',
        refreshTokenTime: 3500, // unit s
        proxyPort: 3010,
        proxyLog: true,
        
        enableStaticJob: true,
        staticBrowsers: {
         
        }
    }
};
