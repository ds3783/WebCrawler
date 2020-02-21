# 对外接口定义

### 状态查询接口
/jobs/status

method: GET

参数：无
返回：
1. status 服务器状态
1. runningJobs 当前正在抓取job列表

```
{
    status:"ok",
    message:null,
    runningJobs:[
        {
            id:1,
            url:'http://www.propertyguru.com.sg/property-agent-directory/firstname/E',
            status:running,
            runtime:123
        } 
    ]
}
```

### 抓取接口
/jobs/start

method: POST
headers:
    Content-Type:application/x-www-form-urlencoded

参数：
1. id
1. url 抓取url
1. sync (1|0) 同步，默认0异步。
1. proxy_host proxy host
1. proxy_port proxy port
1. type 抓取类型，不用页面不一样，每种页面定一个code

例子：
 ```
id=1
url=http://www.propertyguru.com.sg/property-agent-directory/firstname/E
sync=1
proxy_host=l-proxy1.corp.nestia.com
proxy_port=8888
type=AGENT_LIST 
 
 
 ```

返回：
异步，返回{result:true|false}
同步：返回{result:true|false，message:'something wrong',data:抓取结果}

例子
```
{
    result:true,
    message:null,
    data:'<body>......</body>'
}

```

## 测试环境
http://10.0.41.25:3000/jobs/start
测试proxy： proxy_host:8888

### Type 定义

1. PG_AGENT_LIST  Agent 列表页
1. PG_AGENT_DETAIL Agent 详情页（含listing列表）
1. PG_RENT_DETAIL rental listing 详情页
1. PG_SALE_DETAIL  sale listing 详情页