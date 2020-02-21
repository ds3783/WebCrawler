module.exports = {
    extends: 'dev',
    data: {
        type: 'production',
        server: {
            base: 'https://api.nestia.com/${version}',
            crawler: 'http://crawler.corp.nestia.com',
            configApi: 'http://config.corp.nestia.com/api',
            image: 'https://image.corp.nestia.com/api',
        },
        proxyLog: false,
        enableStaticJob: true,
        staticBrowsers: {
            'PG_CONDO_INFO': {
                enabled: true,
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
                user: 'TihonovaEneida92@list.ru',
                pwd: 'ryc083'
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
                enabled: false,
                headlessBrowser: false,
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
