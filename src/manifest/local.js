module.exports = {
    extends: 'dev',
    data: {
        type: 'development',
        server: {
            base: 'https://api.nestia.com/${version}',
            crawler: 'http://crawler.corp.nestia.com',
        },
        proxyLog: true,
        staticBrowsers: {
            'PG_CONDO_INFO': {
                enabled: false,
                proxy_host: '127.0.0.1',
                proxy_port: 7666,
                user: 'allengongproperty@gmail.com',
                pwd: 'gongjiyi2014'
            },
            'LINKIN_RESUME': {
                enabled: false,
                proxy_host: '127.0.0.1',
                proxy_port: 7666,
                direct_proxy: true,
                user: 'ds3783@sina.com',
                pwd: 'sv8fDNwBJPFQF2'
            },
            'CATHY_THEATER': {
                enabled: false,
                proxy_host: '127.0.0.1',
                proxy_port: 7666,
                direct_proxy: true,
            },
            'CAMPAIGN_ASIA_NEWS': {
                enabled: false,
                proxy_host: '127.0.0.1',
                proxy_port: 7666,
                direct_proxy: false,
                user: 'nestiacrawlertesting@gmail.com',
                pwd: 'nestiatesting'
            },
            'LAZADA_ORDER': {
                enabled: false,
                headlessBrowser: false,
                proxy_host: '127.0.0.1',
                proxy_port: 7666,
                direct_proxy: false,
                user: 'cs@nestia.com',
                pwd: 'nestia888@'
            },
            'MOVIE_AGENT': {
                enabled: true,
                headlessBrowser: false,
                proxy_host: '127.0.0.1',
                proxy_port: 24001,
                direct_proxy: true,
            }
        }
    }
};
