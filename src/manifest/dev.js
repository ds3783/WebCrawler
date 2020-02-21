module.exports = {
    data: {
        type: 'development',

        server: {
            base: 'https://api-staging.nestia.com/${version}',
            crawler: 'http://dev.crawler.corp.nestia.com',
            configApi: 'http://dev.config.corp.nestia.com/api',
            image: 'https://image-staging.nestia.com/api',
        },
        screenshotPath: 'data/screenshot',
        captchaPath: 'data/captcha',
        cronJobDataPath: 'data/crondata',
        serverDesc: 'Nestia Web Server V1.0',
        refreshTokenTime: 3500, // unit s
        proxyPort: 3010,
        proxyLog: true,
        defaultVersion: {
            'base': 'v4.5'
        },
        enableStaticJob: true,
        staticBrowsers: {
            'PG_CONDO_INFO': {
                enabled: false,
                proxy_host: '10.0.18.232',
                proxy_port: 8888,
                user: 'allengongproperty@gmail.com',
                pwd: 'gongjiyi2014'
            },
            'LINKIN_RESUME': {
                enabled: false,
                proxy_host: '10.0.18.232',
                proxy_port: 8888,
                direct_proxy: true,
                user: 'ds3783@sina.com',
                pwd: 'sv8fDNwBJPFQF2'
            },
            'CATHY_THEATER': {
                enabled: true,
                proxy_host: '10.0.18.232',
                proxy_port: 8888,
                direct_proxy: true,
            },
            'CAMPAIGN_ASIA_NEWS': {
                enabled: true,
                proxy_host: '10.0.18.232',
                proxy_port: 8888,
                direct_proxy: false,
                user: 'nestiacrawlertesting@gmail.com',
                pwd: 'nestiatesting'
            },
            'LAZADA_ORDER': {
                enabled: true,
                proxy_host: '10.0.18.232',
                proxy_port: 8888,
                direct_proxy: false,
                user: 'cs@nestia.com',
                pwd: 'nestia888@'
            },
            'MOVIE_AGENT': {
                enabled: false,
                headlessBrowser: true,
                proxy_host: '10.0.18.232',
                proxy_port: 8888,
                direct_proxy: true,
            }
        }
    }
};
