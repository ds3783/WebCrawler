(function () {
    var KEYWORDS = ['原创', '转载', '侵权', '授权'];
    var AUTHOR_FILTER = {
        '新加坡圈': function () {
            $('img[data-src*=owCU41mTwIJdcBkTjZ0l1QWL7LnewlqetI6HpxeKibx5ujnDwxBatpIboLUmShVUiaz25JcnwV3UuzM6Vkq8k4ibg]').parent().remove();
            $('img[data-src*=oLmKEmTiaQ7RXtuDV4At2LO8hKRcFiaWj8jricg5UiaXwDw9aYsNIWOWgZ6SmSrUMvIXpnMXYDz8sBpYm7ibpMfzCRA]').parent().remove();
            var tailElem = null;
            $('p').each(function () {
                var $this = $(this);
                if (/^推荐阅读/.test($.trim($this.text() || ''))) {
                    tailElem = $this;
                    return false;
                }
            });
            if (tailElem) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '新加坡眼': function () {
            $('span:contains(获得更多信息｜)').parent().remove();
            $('span:contains(获得生活黄页信息｜)').parent().remove();
            var tailElem = null;
            $('span').each(function () {
                var $this = $(this);
                if (/^(相关|推荐|延伸)阅读[：:]?$/.test($this.text())) {
                    tailElem = $this.parent();
                    return false;
                }
            });
            if (tailElem) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '新加坡狮城论坛': function () {
            var headElem;
            headElem = $('#js_content span:contains("sgcn_com")');
            while (headElem.length > 0 && !(headElem.parent().is('#js_content'))) {
                headElem = headElem.parent();
            }
            if (headElem.length > 0) {
                headElem.remove();
            }

            var tailElem;
            tailElem = $('#js_content span:contains("推荐阅读")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content span:contains("sgcn.com")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '新加坡华人圈': function () {
            $('img[data-src*=zcTHXEYdR33QCgNxiaXUurFvIa2a4qmadzElYiczbKDptCmwf1YhWJredfj2biaOuFFHb8icZZicZicKibGpAtYffDssA]').parent().remove();
            $('img[data-src*=wBb5fdnxUtWbzEQT65RpiaLBtjHDiaWQRSYCx5dhicDoHMVP42y7BjXnFgZM2IbMc7eAFnVn6ze4LqDD1E5NTdSoQ]').parent().remove();
            var tail = $(':contains("领导说了您点一个"):last');
            var parent = tail.parent();
            do {
                parent.next().remove();
            } while (parent.next().length);
            parent.remove();
            tail = $(':contains("点好看，真的会变好看哦"):last');
            tail.parent().remove();

            tail = $('strong:contains("你若喜欢，")');
            parent = tail.parent();
            do {
                parent.next().remove();
            } while (parent.next().length);
            parent.remove();

            tail = $('p:contains("资料参考 /")');
            parent = tail.parent();
            do {
                parent.next().remove();
            } while (parent.next().length);
            parent.remove();

            tail = $('p:contains("大家对此怎么看？")');
            parent = tail.parent();
            do {
                parent.next().remove();
            } while (parent.next().length);
            parent.remove();


            $.each(KEYWORDS, function (idx, key) {
                $(':contains("' + key + '"):last').remove();
            });
        },
        '新加坡教育网': function () {
            $('img[data-src*=N3AoUwoBJjREs7FsT5dqnkwvNJPpTH6aibDueLyyuDaNXG8kENrsoOyXLYZCtKctvGAdHXgLMy4G1SdgY3q18aA]').parent().remove();
            $('img[data-src*=N3AoUwoBJjR9BHEz1QsCw7zamibFvyFcEpwGhxCBIm5nYbiaaGh3VI0LdsNU9BzNW0QjcribmL3EiauGb9phLjibZ0A]').parent().remove();
            var tailElem = null;
            $('span').each(function () {
                var $this = $(this);
                if (/^推荐阅读.*$/.test($this.text())) {
                    tailElem = $this.parent();
                    return false;
                }
            });
            if (tailElem) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '新加坡狮城椰子': function () {
            $('img[data-src*=b0KqbyhMDibISVwOyr6XvKHe8N2hhe16InEns0oAL14bORibrErYr9kcGSEb0NQbqZwI0CErvaVDlYFpXia0eeEzA]').parent().remove();
            $('img[data-src*=SurwvUZl2nmSdofkCQYrRCYEib0Mpe4c1HdlibX05nibibLwibj72efRTQsbPX03uicHiaNMBkXiasEGpx6pQEIrL2P3xg]').parent().remove();
            var tailElem = null;
            $('span').each(function () {
                var $this = $(this);
                if (/把椰子设为星标哦！|相关阅读/.test($this.text())) {
                    tailElem = $this;
                    return false;
                }
            });
            if (tailElem) {
                while (true) {
                    var parent = tailElem.parent();
                    if (parent.is('#js_content') || tailElem.is('p') || tailElem.is('section')) {
                        break;
                    }
                    tailElem = parent;
                }
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '有书': function () {
            $('img[data-src*=GtWwdCwkv7GFibw2nyFhcye46c1b1N9l1ic5q13Gauib5BuSpqib405Jw3C8UESBiaZiakAWv9gmvL4oXwG6S3oJjXmQ]').parent().remove();
            $('span:contains("作者：")').parent().remove();
            var tailElem = null;
            $('span').each(function () {
                var $this = $(this);
                if (/^(记 得 拉 至 文 末 为 有 书 君 点 赞 哦)/.test($this.text())) {
                    tailElem = $this.closest('p');
                    return false;
                }
            });
            if (tailElem) {
                tailElem.prev().remove();
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '随笔南洋': function () {
            var tailElem = $('span:contains("- End -")').parent();
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
        },
        '狮城大爆炸': function () {
            $('img[data-src*=SLvfZyICMl5FY8L6Cx2ibF2TR3c6TBPt5UwJQ4Gs7aHTMj6lEzD9fVOMwevxUTobRfh9ysHSrJUXRKahscv4kIw]').parent().remove();
            $('img[data-src*=SLvfZyICMl5Mia8ycTlkp7KRDW0HfbFSOO5azAD8w0FW0riayGyyiaTSSdiaicNCzvNibFndb3eNYsLxo4LjicnibQm0Gg]').parent().remove();
            var tailElem = null;
            $('span').each(function () {
                var $this = $(this);
                if (/^(看完一周爆料)/.test($this.text())) {
                    tailElem = $this.parent();
                    return false;
                }
            });
            if (tailElem) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '新加坡红领巾': function () {
            $('img[data-src*=N1yb1n7xWKHVm7Dp9n55ibCeyRSWNQLia6fyXbe7J3fbc3aNvuTCRmkfarlIU0ia0slfCS8JOiaEREBMwqsLk1eXlA]').parent().remove();
            //https://mmbiz.qpic.cn/mmbiz_png/N1yb1n7xWKHzRgTaH69psLAHia3JnTeOpN0INFfYTZJV5TnQEygbQ12vU5cVEnC6iaYL33sliakOXc3I7phicuw5mA/640?tp=webp&wxfrom=5&wx_lazy=1&wx_co=1

            var tailElem = $('img[data-src*=N1yb1n7xWKHzRgTaH69psLAHia3JnTeOpN0INFfYTZJV5TnQEygbQ12vU5cVEnC6iaYL33sliakOXc3I7phicuw5mA]').closest('p');

            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
        },
        '新加坡政策': function () {
            $('span:contains("点击上方")').closest('p').remove();
            //https://mmbiz.qpic.cn/mmbiz_png/N1yb1n7xWKHzRgTaH69psLAHia3JnTeOpN0INFfYTZJV5TnQEygbQ12vU5cVEnC6iaYL33sliakOXc3I7phicuw5mA/640?tp=webp&wxfrom=5&wx_lazy=1&wx_co=1
            $('fieldset').remove();

        },
        '新加坡留学吧': function () {
            var tarElem = $('span:contains("共度海外美好时光！")').closest('section');
            while (tarElem.length > 0 && !tarElem.parent().is('#js_content') && tarElem.parent().is('section')) {
                tarElem = tarElem.parent();
            }
            tarElem.remove();
            var tailElem = $('span:contains("更多留学资讯，请及时联系【新加坡留学吧】")').closest('p');
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
            tailElem = $('span:contains("更多留学资讯，请及时联系【新加坡留学吧】")').closest('[powered-by="xiumi.us"]');
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();

        },
        '南洋快讯': function () {
            //https://mmbiz.qpic.cn/mmbiz_gif/v6Qs5mU9QNhcFgYdGV4YPnYa9iaYvN3qLdlHjxEowR5C4fAficqfKMwBibrkfTT6f90kAib7EnsHQYneyKeZldg06g/640?wx_fmt=gif&tp=webp&wxfrom=5&wx_lazy=1
            $('img[data-src*=v6Qs5mU9QNiaxOczqHcpaCUgGzp7MX3U5joBa092SmcqNicgxwMEXcPNhYlSsrw6hasfoyl7ZCcdOhyjPL8mwo4w]').parent().remove();
            $('img[data-src*=v6Qs5mU9QNh9icZfIhwjC0p9NTn30iaV8zVxEtNwg24hKV8sibkM1m5yO7gVFe9moFsnVYIbIdn5PCibCmqz4LakMQ]').parent().remove();
            $('img[data-src*=v6Qs5mU9QNhcFgYdGV4YPnYa9iaYvN3qLdlHjxEowR5C4fAficqfKMwBibrkfTT6f90kAib7EnsHQYneyKeZldg06g]').parent().remove();
            //https://mmbiz.qpic.cn/mmbiz_gif/6aVaON9Kibf5ibKRPQgZ9XgbVNsIeQUnfKPXiaqWuO4ykicUb0HcVJR02cYRpNCOMuCyF79PPQ5839jzO3DKwcJUvw/640?tp=webp&wxfrom=5&wx_lazy=1
            $('img[data-src*=6aVaON9Kibf5ibKRPQgZ9XgbVNsIeQUnfKPXiaqWuO4ykicUb0HcVJR02cYRpNCOMuCyF79PPQ5839jzO3DKwcJUvw]').parent().remove();
            //https://mmbiz.qpic.cn/mmbiz_gif/v6Qs5mU9QNhcFgYdGV4YPnYa9iaYvN3qLxib7dQYFvFtE6M8u7dPWAKP0iathZnctiaiaTCIASmK9UJEEZv7grOjAicw/640?wx_fmt=gif&tp=webp&wxfrom=5&wx_lazy=1
            var clickElem = $('img[data-src*=v6Qs5mU9QNhcFgYdGV4YPnYa9iaYvN3qLxib7dQYFvFtE6M8u7dPWAKP0iathZnctiaiaTCIASmK9UJEEZv7grOjAicw]');
            while (clickElem.length > 0 && !clickElem.parent().is('#js_content') && clickElem.parent().closest('section[powered-by="xiumi.us"]').length) {
                clickElem = clickElem.parent().closest('section[powered-by="xiumi.us"]');
            }
            clickElem.remove();
            var tailElem = $('p:contains("长按指纹，关注关注【南洋快讯】!")').closest('[powered-by="xiumi.us"]');
            while (clickElem.length > 0 && !clickElem.parent().is('#js_content') && tailElem.parent().closest('section[powered-by="xiumi.us"]').length) {
                tailElem = tailElem.parent().closest('section[powered-by="xiumi.us"]');
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();

        },
        '舌尖上的狮城': function () {
            $('img[data-src*=zAoXfd0iaCoknnhDPAEd6A5PDSFibEOuM8kqLfnX6HlsqKaBLJiafGjJIyoSUtoviaCfSCbXyKu4HNVUQNDQ38f24Q]').parent().remove();
            $('img[data-src*=zAoXfd0iaCoknnhDPAEd6A5PDSFibEOuM8ec52ohz0B61Irs3o2RWl3OtYwBC2fCEkSlffLGViblHNFbvhhrl4GTg]').parent().remove();
            $('img[data-src*=zAoXfd0iaColNFOjSJXhXeeR8ZFibRfs8WhibY7n2VOL9NF3NrBiaH94OdgaNJTc9qibVgicCH48dgNR19WkXEvVYY9A]').parent().remove();
            var tailElem = $('p:contains("点击以下小程序直接购买")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('p')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();

        },
        '舌尖上的狮城': function () {
            $('img[data-src*=zAoXfd0iaCoknnhDPAEd6A5PDSFibEOuM8kqLfnX6HlsqKaBLJiafGjJIyoSUtoviaCfSCbXyKu4HNVUQNDQ38f24Q]').parent().remove();
            $('img[data-src*=zAoXfd0iaCoknnhDPAEd6A5PDSFibEOuM8ec52ohz0B61Irs3o2RWl3OtYwBC2fCEkSlffLGViblHNFbvhhrl4GTg]').parent().remove();
            $('img[data-src*=zAoXfd0iaColNFOjSJXhXeeR8ZFibRfs8WhibY7n2VOL9NF3NrBiaH94OdgaNJTc9qibVgicCH48dgNR19WkXEvVYY9A]').parent().remove();
            var tailElem = $('p:contains("点击以下小程序直接购买")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('p')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();

        },
        'Nancy时尚笔记': function () {
            $('img[data-src*=ANpLcOGhzUiaVHq7Mj3R2tuoLHIqtUweS1ZfAULgZvV8wNoZ93W0PEUVOTEF04hy04Vz8RdqrM8ctjZj0quUMpQ]').parent().remove();
            var tailElem = $('span:contains("点击图片进入小程序")').closest('[data-role="paragraph"]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('p')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();

        },
        '蓝色的雪枫': function () {
            $('img[data-src*=ScIWwTD7pHLqqX5lC2p7QMTsylwkVAicmalkmvs21Qpbv6EyGlRLXhkgiamoIvjm33PiblFTFvW3BvyZZib5eIj7Pw]').parent().remove();
            $('img[data-src*=ScIWwTD7pHJibx3hk701WLQib4PIKB99jbtiafYg8YviaOtjaxQoNvm5lcJ2b2vtrEgCDAicPBtsViaxaATGmtyOob7A]').parent().remove();
            $('img[data-src*=ScIWwTD7pHKTkZXibo55m4gBlkntNwgyS7QRPLE6oWtyNkoUcncOaMPX94DlpSMu2K5XKol6gulZjP20ia9GKJXw]').parent().remove();
            $('img[data-src*=ScIWwTD7pHKuAJGU7lhkCRkyO4UHmPWbEFStFjLMvsPGTTXL6p6VI6FdpdoczX67PlWKD2ticgyWmwuwuLobicicQ]').parent().remove();
            var titleElem = $('span:contains("新影剧|娱乐资讯")');
            while (titleElem.length > 0 && !titleElem.parent().is('#js_content') && titleElem.parent().is('section')) {
                titleElem = titleElem.parent();
            }
            titleElem.remove();


        },
        '泰国中文网': function () {
            $('strong span:contains("热卖")').closest('p').remove();
            var tailElem = $('span:contains("推广")').closest('[data-author="Wxeditor"]');
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();


        },
        '泰国网': function () {
            //https://mmbiz.qpic.cn/mmbiz_jpg/1TzyfrZicmYaUnicNT8J63GMbtttQ4Zkw1manwLkjCLv7B9RZYf93EpQIzTHdpaVgpEEf83wIibPGDqk4iaDpSaoRg/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1
            $('img[data-src*=1TzyfrZicmYaUnicNT8J63GMbtttQ4Zkw1manwLkjCLv7B9RZYf93EpQIzTHdpaVgpEEf83wIibPGDqk4iaDpSaoRg]').closest('p').remove();
            $('img[data-src*=1TzyfrZicmYbz1XdCBHPOTU9cFZicbwnbAXDXf6yfichKa2TJ0Jfe0fDGHpxLRfme7XVGRIvdMIjH8iclsCAvwYxyg]').closest('p').remove();
            //https://mmbiz.qpic.cn/mmbiz_jpg/1TzyfrZicmYZ8RicEW6ruDlxaGcQqwyJTKvQGZkke1NDw6vZvdPPtorWIbXsTETy0n4O5MMBMtPMNjTDhQ7jdumA/640?wx_fmt=jpeg&tp=webp&wxfrom=5&wx_lazy=1&wx_co=1
            var tailElem1 = $('img[data-src*=1TzyfrZicmYZ8RicEW6ruDlxaGcQqwyJTKvQGZkke1NDw6vZvdPPtorWIbXsTETy0n4O5MMBMtPMNjTDhQ7jdumA]').closest('p');
            do {
                tailElem1.next().remove();
            } while (tailElem1.next().length);
            tailElem1.remove();
            var tailElem = $('span:contains("来源")').closest('section');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            //tailElem.remove();


        },
        '菲律宾世界频道': function () {
            $('#js_content>![powered-by="xiumi.us"]').remove();

        },
        '暹罗飞鸟': function () {
            $('#js_content>[label="Powered by 135editor.com"]').remove();
            var tailElem = $('span:contains("旅游 签证 投资置业攻略")').closest('[label="Powered by 135editor.com"]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
        },
        '据说娱乐': function () {
            // $('#js_content>[label="Powered by 135editor.com"]').remove();
            var tailElem = $('span:contains("你可能还想看")').closest('section');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
        },
        '娱乐大爆炸': function () {
            $('img[data-src*=0n4nsh5R6vY4u1pM8n7XMuz6vdKv8JNL7iaGZK4109kjp5ntHy8ibicvxRfo56FwLxvmI3g4wXrV9wWKYtPadk15A]').parent().remove();
            $('img[data-src*=0n4nsh5R6vY4u1pM8n7XMuz6vdKv8JNL7HfmdkqiaPfusd1rYZttcxYYhY48EU2UQFiaauI5ve0KOIg5h2D4rMbA]').parent().remove();
            var titleElem = $('p:contains("娱乐圈的一股独流")').closest('section[label]');
            titleElem.remove();
            var tailElem = $('span:contains("往期精选")').closest('p');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('p')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
        },
        '深八娱乐圈': function () {
            var tailElem = $('strong:contains("商务合作：9994282")').closest('p');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('p')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
        },
        '橘子娱乐': function () {
            $('img[data-src*=53Ny1fP0LBURMf86hk2r2p7Dt7icPvKzgW5V3lAo08QibIyJ1BjPrysFWJVUwAXjRy0kCicoGx2Qql1G2ia0bw8sKA]').parent().remove();
            $('img[data-src*=53Ny1fP0LBV1icmBV2QnhibKarKPPXfqagNye3BYM5o1B99t5xMgWXTmCzbpAcz6ljqiaW5lWFN3aOVuRXoEIrIfg]').parent().remove();
            var tailElem = $('strong:contains("往 期 回 顾")').closest('section');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
            tailElem = $('img[data-src*=53Ny1fP0LBURMf86hk2r2p7Dt7icPvKzgvdKNjtDLRkS109G8MTRmFPMDLX9pZmKGWqXfFYmq7zc9pz2yibFY9aQ]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
            tailElem = $('img[data-src*=53Ny1fP0LBVCgfbS8ia3fFXh2P3jy5jMPjPFcp4BuYDnXDjaDupFkHM3lxlkPagdPQczpTVDBjK3hwIvnDib2UeA]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
        },
        '电影杂志社': function () {
            $('img[data-src*=Dd6icOSXaHiaePssW9CK6icwXviashsDtJwOndc9wyMjg33kxu83CQOutFlicGKOC1Fccztia4icic9dOX0q5uOspncEuw]').parent().remove();
            $('img[data-src*=Dd6icOSXaHiaf1KHcSLSP3DehGrkicBEzI7RbRUNiatL8EAOeE7zQVlmHQ6ib3XRxm31BQjxl3SZqTmE8lYEQ3GPvTw]').parent().remove();
            var tailElem = $('strong:contains("好 文 推 荐")').parent();
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && !tailElem.is('p')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
            $('span:contains("（文、图侵权必究）")').remove();
            $('#js_content > section').each(function () {
                var $this = $(this);
                if ($this.css('display') === 'flex' && $this.css('flexDirection') === 'row' && $this.children().length === 3) {
                    $this.remove();
                    return false;
                }
            });
        },
        '影视Mirror': function () {
            $('img[data-src*=gcu9ejV52nR3AltjPOZMN7dNxOH9lALhQO6W3qhoCWCZRRd81cKs1e3SicFOqMphEMPCyEsahibUxcDPGfjJk01Q]').parent().remove();
            $('img[data-src*=gcu9ejV52nR3AltjPOZMN7dNxOH9lALhyhicbaA8lRQqr6680J67UPcdnPm2wibSKsA3Q2a5MEfLLkicFXjUakpibw]').parent().remove();
            $('img[data-src*=gcu9ejV52nSVlwaxBfYKvHgLicibia9vibWFUm3CPmYYkZoAZNDDmaYcia2Qyib6W3pWsgUibfmgicgkYicYKxwp1zmryKA]').parent().remove();
            $('img[data-src*=gcu9ejV52nRBtNnrySP7mfo967XiaEboJOxWyn9s83sK3gIWsichynibQicGu3sSUXBSOt0oDSGR2IniaLz1nZE2KOg]').parent().remove();
            $('img[data-src*=gcu9ejV52nRBtNnrySP7mfo967XiaEboJaSd63bN9xYu2AM59HBfBp35ceLmia3IKttJkCuCb3ut0n4tnvdZrHHA]').parent().remove();
            var tailElem = $('span:contains("—The End—")').parent();
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
            tailElem = $('span:contains("文末福利")').parent();
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();
            $('#js_content > section').each(function () {
                var $this = $(this);
                if ($this.css('display') === 'flex' && $this.css('flexDirection') === 'row' && $this.children().length === 3) {
                    $this.remove();
                    return false;
                }
            });
        },
        '凤凰网时尚': function () {
            $('img[data-src*=l3aaTWA4LficPJsdQu6WuBkYMPkF3PyOR8B82LTXtValV8DuFeMHr4o8XTWyjEwDAK4wBChCicFAeAdKw3ucENDQ]').parent().remove();
            var tailElem = $('span:contains("往期也同样精彩")').parent();
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            do {
                tailElem.next().remove();
            } while (tailElem.next().length);
            tailElem.remove();

        },
        '毒药': function () {
            $('img[data-src*=otQbDbe5W7KUwPU5EnMQNqK0iaWOU4ticF1W5E1fCibRnmcedldChQLY8wn77pkpB9bJqoVgic8e2S1anT6X1dHLKg]').parent().remove();
            $('img[data-src*=otQbDbe5W7JtWTxb2RCAkic7xAMJyEFTj0uGaR7YFgI0lcnibtlfFNL3icxd8FajyxjCE0s5fYoPySPjFhrs9by9g]').parent().remove();
            var tailElem = null;
            $('strong').each(function () {
                var $this = $(this);
                if (/近\s+期\s+热\s+点/.test($this.text())) {
                    tailElem = $this;
                    return false;
                }
            });
            if (tailElem) {
                while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                    tailElem = tailElem.parent();
                }
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '湖南卫视': function () {
            $('img[data-src*=nPQsuRTBhXN8ia8dlp4WCYxVCbcgIPTU83jop2qnMeBqDz3NNrMLXgbDcYE8iarS8Ndm1hdKvBV1k6M4Iv1bX1iaw]').parent().remove();
            $('img[data-src*=nPQsuRTBhXN8ia8dlp4WCYxVCbcgIPTU8esekRvQpD9ZJvQAibUxndDRjo3Wib5AtQOEWBicSqCvYhK4BM3xQdicdicw]').parent().remove();

        },
        '香港电影': function () {
            $('img[data-src*=diapuKqU5MdxAyKxBFhTqRDjEpuSj8ialOfzE2vCE1OG8Xv82lViarAaeMuiceMtibz7YohE8HdZibBq2ibTgUWUvBpCg]').parent().remove();
            $('img[data-src*=fsRLOkIjNquHvUDKa1OwkMGTqYqQNlf1qz7IRvC5q7wLKoVJs4OUZTAdKsDCormL0cCGyXcyia6UKk55XpuQBJg]').parent().remove();
            var tailElem = $('span:contains("这里没有小编")').parent();
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('strong:contains("投 稿")').parent();
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '番婶儿说': function () {
            $('img[data-src*=a6huCRZOyE1qeSprNPWGl3w4Fm97aXTv55NuvEcTlsmtGct5MVxUuPqc4oh00LrhOD61TibcXtFBc3nqxjX2ghA]').parent().remove();
            $('img[data-src*=a6huCRZOyE1LrX6rJF8oG31UttTNzIm69dibpvnRGjMrzc23y7aKPfPPY7VJicicTwEPLW2gZXM1880vbmEK0z9QQ]').parent().remove();

        },
        '创意社': function () {
            $('img[data-src*=W9ib9oKeQ3X6mMcDmmoSYpvxZ1PoFvgHECMjs2kicmbibNtFjricnwVZJNogzSIsTGBicGopDRW958IZzlKf3ZwTicCQ]').parent().remove();
            var tailElem = $('img[data-src*=bfVcBDKIb4wsCicpAIYJgnA7TOGXl1Xz8QLPk5fLQJy8T3vfdwX3nYLqhfkmnxuojia6VCricibxTdHxfAvAiaoYaUg]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('img[data-src*=bfVcBDKIb4wsCicpAIYJgnA7TOGXl1Xz8QLPk5fLQJy8T3vfdwX3nYLqhfkmnxuojia6VCricibxTdHxfAvAiaoYaUg]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '意林': function () {
            $('#js_content *:nth-child(1) img').parent().remove();
            var tailElem = $('img.__bg_gif');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && !tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('span:contains("点击右上角")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && !tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('span:contains("本文选自")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && !tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('span:contains("来源：")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && !tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('span:contains("-END-")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content') && !tailElem.parent().is('section')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('img[data-src*=SzK1NthS8ib6W9Xh1cuJHJYyodoMyLOlThNtbyicgbl6YFczkN1QibeHLkYc50dicPmF8uEu5XmICBM2ob7OQib6iaXA]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '江苏卫视': function () {
            $('img[data-src*=e8uZNP0ZuzUa9kbeGPibZEKmMicYC83oTWm8CdI2usPfE9Q8Sj64yJZsmVPUdzwWTMcxcjGNUH4xHIpymzqDIo9A]').parent().remove();
            $('img[data-src*=e8uZNP0ZuzUZ7o7SJI80eCRxjvaZLicYnBgfg9dLkrkxmVvk22QibuDu1EgcTAIICMsIiboRbicoKp5WearTSphGcw]').parent().remove();

        },
        '加零姐': function () {
            $('img[data-src*=whWSB4e0QDxo5e7ib1E0VTzx8BRQwTNvwfXPD7gQwmXia77rIZqe0ywZCjV2Y5CbrCNz15rG5uH9MvhjNttLAwpg]').parent().remove();
            $('img[data-src*=whWSB4e0QDzbOE5DdbA1yEpGxicQjFHdSFCuZqw2DXtVUhqPiaom5HaLeJkz6sQS0TESeW0A5PhHO3RksBmEMAMA]').parent().remove();
            $('img[data-src*=whWSB4e0QDxCC9tNIPYl1rWrtmQ0NFLWibicHevep30fefhQgxxqXuWyPzb0XjR6Lr59afx1bGcZ8X42tLgCrOCQ]').parent().remove();

            $('p:contains("18310230939")').parent().remove();
            $('p:contains("点击上方蓝字")').parent().remove();
            $('span:contains("点击上方蓝字")').parent().remove();
            var tailElem;
            tailElem = $('img[data-src*=whWSB4e0QDyAqnXD5Q0Cxuufu0jQtv5iaGEHXUfHbqSVJfQlFicNtROXccKh5pv9QL9XIrzMcuxUy8ftGJeNrx6A]').parent();

            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        'IT大佬': function () {
            var tailElem;
            tailElem = $('strong:contains("延伸阅读")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        'OFweek': function () {
            $('img[data-src*=pS21fericWsINzcGSAyeo5OJJbQc11NhB0LUNeVWy8n0JOgXl397Jx5WG1QbImRPlM9iaQX4A3SClNEiaBzdJaCLg]').parent().remove();
            var tailElem;
            tailElem = $('strong:contains("延伸阅读")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '石家庄肾病医院肾病之友': function () {
            $('img[data-src*=Djp031yQq164TjRxm6Ta1oEW2ORRc7ABbGX83MniajOuoZH1tibU9yZiaHzxFcjy5bTYMp2cLdofyOfEZ4o7ghomw]').parent().remove();
            var tailElem;
            tailElem = $('#js_content strong:contains("阅读原文")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '快乐孕育孕妇课堂': function () {
            $('img[data-src*=icm1qib2pibYHP7WBkibEnCxmgI106yuOHl2gE6gCFBThKs39sZO9y0ibqsQVYeQCJaXo4e0ic1XgSrzFB9jWgNAvzzg]').parent().remove();
            var tailElem;
            tailElem = $('img[data-src*=fgnkxfGnnkQz0Q6VgwoOVXE5dDcdps6vwv7Gibzc5fvZojytqApt1YJZQYKzRkSz8gFVRZXPO35w00Sjx0USBibA]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '锐意医学网': function () {
            // $('img[data-src*=icm1qib2pibYHP7WBkibEnCxmgI106yuOHl2gE6gCFBThKs39sZO9y0ibqsQVYeQCJaXo4e0ic1XgSrzFB9jWgNAvzzg]').parent().remove();
            var tailElem;
            tailElem = $('p:contains("回复关键字")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '守护心血管': function () {
            $('img[data-src*=eD9j932AyBiaAKZvJpjZpapibn9V77d5llN0cFOPyVxMDkgzlyyalpuJObZ6biaIbTeyTLoHQCoTKMKacPHGSbOSQ]').parent().remove();
            var tailElem;
            tailElem = $('img[data-src*=eD9j932AyBjzkLA7BSZoYpCC3qsvS2PBmK2yFmqUFGkW8icaxEL41RCL4Dia3RuIUYtMQ0HC4fciaxR8IiasL9h6zw]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '心脏病防治联盟': function () {
            // $('img[data-src*=eD9j932AyBiaAKZvJpjZpapibn9V77d5llN0cFOPyVxMDkgzlyyalpuJObZ6biaIbTeyTLoHQCoTKMKacPHGSbOSQ]').parent().remove();
            var tailElem;
            tailElem = $('strong:contains("推荐阅读")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '备孕知识': function () {
            $('img[data-src*=kVOgfiap8Ucly1XBTmicQicvmleVCLEQK08oD0wUuv6WpL5PvHH0Lnl8aiaVSZ80gViaj8E7cPxtKQ3yyYH8qM5p5qw]').parent().remove();
            $('img[data-src*=kVOgfiap8Ucnfjc0TnUsk5NZN50BsicfEd4NBRQuLS02oDEodOvtxYAV7M2WS1jWKAHHJwBtRJ9hTjMDolWSRdMQ]').parent().remove();
            /* var tailElem;
             tailElem = $('strong:contains("推荐阅读")');
             while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                 tailElem = tailElem.parent();
             }
             if(tailElem.length>0) {
                 do{
                    tailElem.next().remove();
                }while(tailElem.next().length);
                 tailElem.remove();
             }*/
        },
        '备好孕学堂': function () {
            $('img[data-src*=81g1RmGSFoOu7vsMtjCDmmleOWPlGPf9g7ExBNbxQLV0YPMAicfYIe3SSVdDgVLuVyZ3eeN4YFFG2XtxQoKnjhA]').parent().remove();
            $('img[data-src*=kVOgfiap8Ucnfjc0TnUsk5NZN50BsicfEd4NBRQuLS02oDEodOvtxYAV7M2WS1jWKAHHJwBtRJ9hTjMDolWSRdMQ]').parent().remove();
            /* var tailElem;
             tailElem = $('strong:contains("推荐阅读")');
             while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                 tailElem = tailElem.parent();
             }
             if(tailElem.length>0) {
                 do{
                    tailElem.next().remove();
                }while(tailElem.next().length);
                 tailElem.remove();
             }*/
        },
        'SBS大健康': function () {
            $('img[data-src*=Rg4yDs3siaj4hibySFwL0iamjGljoxvt8F9ZjA9t2zqticB1Gk1LbE3uIpHvpvnUHZKKsjZcBmApDEp8LFibZUbjicJw]').parent().remove();
            var tailElem;
            tailElem = $('strong:contains("下面这些文章")').parent();

            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('strong:contains("关注+星标")').closest('p');

            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '宅客频道': function () {
            $('img[data-src*=Rg4yDs3siaj4hibySFwL0iamjGljoxvt8F9ZjA9t2zqticB1Gk1LbE3uIpHvpvnUHZKKsjZcBmApDEp8LFibZUbjicJw]').parent().remove();
            var tailElem;
            tailElem = $('span:contains("招聘好基友的分割线")').parent();
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '壹观察': function () {
            // $('img[data-src*=Rg4yDs3siaj4hibySFwL0iamjGljoxvt8F9ZjA9t2zqticB1Gk1LbE3uIpHvpvnUHZKKsjZcBmApDEp8LFibZUbjicJw]').parent().remove();
            var tailElem;
            tailElem = $('strong span:contains("End")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '环球网': function () {
            $('img[data-src*=qkQTRn2Z9NxCgC7wX0QbY5VDSQo0WjW951cgqu7bo122UYELic7WvyP8tasVuyARWlTHRA4iaJxoW2W6MvRypFmw]').parent().remove();
            var tailElem;
            tailElem = $('span strong:contains("往期回顾")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        'DoNews': function () {
            // $('img[data-src*=qkQTRn2Z9NxCgC7wX0QbY5VDSQo0WjW951cgqu7bo122UYELic7WvyP8tasVuyARWlTHRA4iaJxoW2W6MvRypFmw]').parent().remove();
            var tailElem;
            tailElem = $('strong span:contains("特别声明")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '药评中心': function () {
            $('img[data-src*=CB0BZ6GAshjiaxjcc8r7y2Gpibj3VNf9oZdIuZQtJgRHWFN2gwAb28xDhZpoDnb2pGiaaZ9D2XW1A3m7iatpjFib1Pg]').parent().remove();
            var tailElem;
            tailElem = $('img[data-src*=CB0BZ6GAshgfMtib2rvdic9ic4RbqHe3xxYoYbwnL4icDNW0r3icCGrAfLReNtnxMkLv0biaCT1wkIJ1FDU4fasXMH9g]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '腾讯健康': function () {
            // $('img[data-src*=CB0BZ6GAshjiaxjcc8r7y2Gpibj3VNf9oZdIuZQtJgRHWFN2gwAb28xDhZpoDnb2pGiaaZ9D2XW1A3m7iatpjFib1Pg]').parent().remove();
            var tailElem;
            tailElem = $('p:contains("更多内容请查看原文")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '娱乐最爆点': function () {
            $('img[data-src*=B8sNq6UqG2LLf4heZGX4liaUzEVMz4Jz9Z8go3JnUsZrTuiaeWLhaUuhU0ibdQ9miacncQtb2QFJybGIGuNLAFYtTQ]').parent().remove();
            var tailElem;
            tailElem = $('img[data-src*=W9ib9oKeQ3X4WtgibCOfjIzcwnR7Cve3lqN6YT9N0JnQ2TpB9FTmhPTIiaKKqdBdmoMnzhrIqGzMPiam4via43hYmiaw]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('img[data-src*=B8sNq6UqG2J9xzYEJsHy6rsQnicRrvcCCTH2y1Q4PC5kKo1ZlXJgddBBCXu3Gq2VQlwvaAwQEJmzLvI7XkWq00A]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '智东西': function () {
            $('img[data-src*=z7ZD1WagSLjMDibnaR9TNpjcNAEt0VoA0xUgA9pThTHO5ByuIBmjOCtqAXyJuNRgaMQhB9WT9V9vCZ4Uia9Lg40A]').parent().remove();
            $('img[data-src*=z7ZD1WagSLjvg08iay2picicPevEkYgRU387k6WCoj2ds9d8gb6KGI7DW7AMI07nq56fcduQzkopPbbzTaFL4bVVw]').parent().remove();
            $('img[data-src*=z7ZD1WagSLhicuBEXORL2eUTCkymkuVqRJ7PBftcfXYoNcTeA1f3aAUHphdHbc78DEToCBgzibM2xVfSbuDaDkLw]').parent().remove();
            $('img[data-src*=z7ZD1WagSLiaNbr1EPlbHrzYOIF87qXleWTFKkgHLsENwqaDicliaJh0QDnw6H2HmjfNg3IkXGh6LywXYQJiaP221Q]').parent().remove();
            $('img[data-src*=z7ZD1WagSLgFt8txemHtrKUiaFRQ3Fzr7iauOLciab2qoVbXxdYJJIudlkIZokCGiaATlXV3ULibLIAEBbcx1ffia16w]').parent().remove();
            var tailElem;
            tailElem = $('p span:contains("本账号系网易新闻")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('span strong:contains("zhidxcom")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '汽车商业评论': function () {
            $('img[data-src*=aSdqrB9ibm0WGCxRvF9A11CP5jGcZ21sh923MeiaibrR0Zv8DdbbYOfKwCD7iap7dALS5Flnfib7xsPakayCMAoa7yQ]').parent().remove();
            var tailElem;
            tailElem = $('strong span:contains("更多内容")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('img[data-src*=aSdqrB9ibm0XPPU5tWst9DIWhicKLriaYj0RLicBKs3EJFgGe8vqvCLjTficVU85HnYyW2Mt2sVNYVFIe9IsqtS1guA]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        'BWC中文网': function () {
            $('img[data-src*=1Gfhv3UUWo9QDD3yRGo6WL01iaKeOkphic25F97MiaejGjeUw8myVHFKKPMHAI5nMCyyicnZqxJmADwK1ibOOakhpmQ]').parent().remove();

        },
        '装修百宝书': function () {
            $('img[data-src*=tuPPlgyxy1MAYOuFhuR8vAk8mIpchZeXwgvCfFbPTXJndmEic6GjdE2dfaFyRkuD1iaemVu224gchAnjUfPXDEGw]').parent().remove();
            $('span:contains("点击蓝字")').parent().remove();
        },
        '时尚家居': function () {
            $('img[data-src*=cvdsRVHsY7fI3wExfgmqzUo3iaVhdcWGChiarXw1bUoxpwkQNp7narFNRbFg74CrpzY4w1Hiaib48x2YWAzibCnKKJw]').parent().remove();
            $('img[data-src*=cvdsRVHsY7eJJHVGd74FDZNLjp9ib2DIuzib5GgC5rLS2z639OQLC6Mf7kicOo1oG3W1bysfkvKuWvXkEDibWribSUA]').parent().remove();
            var tailElem;
            tailElem = $('strong span:contains("你可能喜欢")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '装修33天': function () {
            // $('img[data-src*=cvdsRVHsY7fI3wExfgmqzUo3iaVhdcWGChiarXw1bUoxpwkQNp7narFNRbFg74CrpzY4w1Hiaib48x2YWAzibCnKKJw]').parent().remove();
            $('#js_content span:contains("点上方蓝字可关注")').remove();

            var tailElem;
            tailElem = $('#js_content span:contains("媒体转载请注明")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content span:contains("后台回复")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }

            $('#js_content span:contains("装修33天")').remove();
        },
        '家装室内设计': function () {
            // $('img[data-src*=cvdsRVHsY7fI3wExfgmqzUo3iaVhdcWGChiarXw1bUoxpwkQNp7narFNRbFg74CrpzY4w1Hiaib48x2YWAzibCnKKJw]').parent().remove();
            $('#js_content span:contains("每日搜集分享国内外最前沿的")').closest('section').remove();

            var tailElem;
            tailElem = $('#js_content span:contains("装修公司投稿")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content img[data-src*=Ljib4So7yuWhLpn9xbYuSW4uGQ45rhwYygA3NgF60Hun16FGMan7Oia8RwWorKdCkyh47vQfPwsx36zy9fyDfeqQ]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content strong span:contains("设计：")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }

            $('#js_content span:contains("装修33天")').remove();
        },
        '一街拍': function () {
            $('img[data-src*=LAptqPMVmQ2VdiaKvu7GibDzS10PYM3icAv38VhPR1GlFiaPvWbyeCiankj5ORMjslfHiaicpTFiciaQicnm2DnbyEXQb3tw]').parent().remove();

            var tailElem;
            tailElem = $('#js_content img[data-src*=LAptqPMVmQ1n6l3p03uRHDiblSNsyUtnPYbYb3Yhz93CIjTGibP81WMVnQSVPSdrXmpS5xIXicN5HJm26ma8bHkPQ]');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '奢侈品时尚': function () {
            $('img[data-src*=cgQ9TFSSNz6T1hSkaUVsKyz4PvHUhIOek4sqE7Q2k05qGa61dSRALXuvk1eYibxQuIqLneuSo9sjJdnFBK12P7w]').parent().remove();

            var tailElem;
            tailElem = $('#js_content strong span:contains("更多往期精彩")');
            while (tailElem.length > 0 && !tailElem.parent().is('#js_content')) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '爱奇艺时尚': function () {
            $('img[data-src*=Hey2N7g1r10rR3U3YedLQB5SdbLL7fsd5lmYdgG5P0aE7NUsfAYFrAyG2xAP5WMsKG1krlzZG80NgsSkRyeDXg]').parent().remove();

            var tailElem;
            tailElem = $('#js_content strong:contains("精彩推荐")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content') || tailElem.parent().parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content strong:contains("近期精彩")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content') || tailElem.parent().parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content strong:contains("按二维码")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '吴佩频道': function () {
            /*$('img[data-src*=BdS36rTEVOHSXLCtT1e6bicJhojG0qTeQYGIVQBdUuadlsSgZRpqGpsd3SuTTPCUyJfmp6JfJAiayj3g2kw5PbIQ]').parent().remove();
            $('img[data-src*=BdS36rTEVOHSXLCtT1e6bicJhojG0qTeQ5dDONM9HLibmgtJl7aJcF8IkrOE5fnIb5teM7jYnKV63fibwdv1CI8vw]').parent().remove();
            $('img[data-src*=BdS36rTEVOHM5HUdZkwrEao6W93ykMbD2oaxKXVHu3icRLyyickTvjFrobZtg7ptNp4MHzNlVRSafjVpiaLA1EDsw]').parent().remove();
            $('img[data-src*=BdS36rTEVOHM5HUdZkwrEao6W93ykMbDibt5QgZKiaRPNsb3wpjOFhQ4GrWKMacQGaYBHTZeWYWEQiaJBdH2ibWPUg]').parent().remove();
            $('img[data-src*=BdS36rTEVOGcLdynPJS6X3y5C7sX76icEcJXDR5t2aoeD6jhXL330bRLKKiabYEP5Tp05Ge0Oj3czd5F1XibFMMbA]').parent().remove();
            $('img[data-src*=BdS36rTEVOGcLdynPJS6X3y5C7sX76icER1DYtOGric1MCNA16pq1Sr0onEqnODAsItmrh4d0xNecia2xtwPCficDA]').parent().remove();
            $('img[data-src*=BdS36rTEVOElrOpYiaIsFkBYq3uGicEHicXZvpMPhqS0a6fiaZcicaxH3gSWmtibQBULdbemwuLaMR9gibyEdf7KT6mEQ]').parent().remove();
            $('img[data-src*=BdS36rTEVOElrOpYiaIsFkBYq3uGicEHicXzAVbBzqWmbUH0ZdelcLtlqGPVFEoZoRmGgIpXnpGld4WnsDocJM0lQ]').parent().remove();
            $('img[data-src*=BdS36rTEVOEvrkPRQZOq1mdJVHsDjJicB5vkktRBUMrbcGzPcYkbkzjjEwp3KB8URoFwmT5dicwq1ZiaxRCickmgyw]').parent().remove();
            $('img[data-src*=BdS36rTEVOEvrkPRQZOq1mdJVHsDjJicBTeib6rBs7eIgiaiaXvh6rCXcNnEqsqOusZ3dIhcpTlbcV2o4eM1OtFNGw]').parent().remove();
            $('img[data-src*=BdS36rTEVOEe9oz7mMapWyG0wFJut60Lo2dGeWDpwORmbicg4fFeKMQGicLULibYGMMYchtsHDnZUpXMdOA6uMNhA]').parent().remove();*/

            var tailElem;
            tailElem = $('#js_content strong:contains("轮到你说：")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '时尚生活派': function () {
            var content = $('#js_content');
            var children = content.children();
            for (var i = children.length - 1; i > 0; i--) {
                var elem = children.eq(i);
                if (!$.trim(elem.text())) {
                    elem.remove();
                } else {
                    break;
                }
            }
        },
        'LonelyPlanet': function () {
            $('img[data-src*=ibfcEBXnhh0bnlPM9JwEdMVI3aNtIjbjTbiac1GE6uEOoCBt7Au0YOLL16GvMhHddsOHwqfYXy1RwcicXic4LV5nlw]').parent().remove();
            $('img[data-src*=ibfcEBXnhh0YSibsRibZMss22k7E90bNIyEbQFPRDLsFc9XtSBfBdMLYyZnicicPweLB5t2TiasFfvv9DUZxdKJXibicYw]').parent().remove();

            var content = $('#js_content');
            var children = content.children();
            for (var i = children.length - 1; i > 0; i--) {
                var elem = children.eq(i);
                elem.find('a').remove();
                if (elem.is(':contains(">>")')) {
                    elem.remove();
                } else if (!$.trim(elem.text())) {
                    elem.remove();
                } else {
                    break;
                }
            }
        },
        '好豆': function () {
            $('img[data-src*=u7T0UnOhDHAnibmWGyL2JIhaUYMDx0m2pJ7WdcibQkkD9GxCDr6iaaYEnlBzPKIO5icsV9rNzrrSfdrjPKBqYTvRqg]').parent().parent().remove();
            $('#js_content span:contains("关注好豆君")').remove();

            var tailElem;
            tailElem = $('#js_content span strong:contains("你们还有哪些")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content') || tailElem.parent().parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '拾味爸爸': function () {
            $('img[data-src*=u7T0UnOhDHAnibmWGyL2JIhaUYMDx0m2pJ7WdcibQkkD9GxCDr6iaaYEnlBzPKIO5icsV9rNzrrSfdrjPKBqYTvRqg]').parent().parent().remove();
            $('#js_content span:contains("关注好豆君")').remove();
            var headElem;
            headElem = $('#js_content span strong:contains("视频观看步骤更直观")');
            while (headElem.length > 0 && !(headElem.parent().is('#js_content'))) {
                headElem = headElem.parent();
            }
            if (headElem.length > 0) {
                headElem.remove();
            }
            var tailElem;
            tailElem = $('#js_content strong:contains("近期推荐食谱：")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '贝太厨房': function () {
            $('img[data-src*=1GtTFF0DrhlSVHVibiclouaut9gZ1FPxFvpJ8Bw9EcsbIUUXjv3iceobp2Wswbz9LTanfbgpficAbl8Cu6fREEVNUg]').parent().remove();
            $('#js_content span:contains("进入小程序")').parent().remove();
            var tailElem;
            tailElem = $('#js_content strong:contains("安小厨de小广告")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content') || tailElem.parent().parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            var parent = tailElem.parent();
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            if (parent.length > 0) {
                do {
                    parent.next().remove();
                } while (parent.next().length);
            }

            tailElem = $('#js_content strong:contains("长按识别下方二维码")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content span:contains("想了解更多")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '健康志I': function () {
            $('img[data-src*=fNTwKc7iaSrOayXKOiahxCFP9tXe4o4MgkJiaSThw0wTId6SnVzG2x7TMKEl4hsmvGGibKvibibdVcI4v8w4sqnCbbfQ]').parent().remove();
            $('img[data-src*=fNTwKc7iaSrOxoPmic6CJzDEMUck3YtWy83Aqeo97mqf6PJoMKhibBJghOIyfr82MQyBaSmzdXehp9VcpGAiaavHuA]').parent().remove();

        },
        '柳号KO与格斗': function () {
            $('img[data-src*=iaoUdSTHoTiaKHWZ8e6CuldLpvibQK5z6Q8NJHwS4gqPJ8uGuUWNdRCsn7ISJUNOMOBRGsH37VZ94icLGD14Zvl46Q]').parent().remove();

        },
        '腾讯NBA': function () {
            //剔除前面视频
            var childrens = $('#js_content').children();
            var firstElem = childrens.eq(0);
            if (firstElem.find('iframe').length > 0 || firstElem.find('.js_tx_video_container').length > 0) {
                childrens.eq(1).remove();
                childrens.eq(0).remove();
            }
            //推荐阅读：
            var tailElem;
            tailElem = $('#js_content strong span:contains("推荐阅读")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '詹姆士的厨房': function () {
            $('img[data-src*=2zxaP93End2De6NTO1iasvSQwnge0qMuAMmVlMZ2LicmelOxPXia7L1WiaqaGM8viciaPuuCIOicpXWdtFB4Wxic5gEibjw]').parent().remove();

            //推荐阅读：
            var tailElem;
            tailElem = $('#js_content mp-miniprogram');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content img[data-src*=2zxaP93End1icJdsYAzdrlpAHniae8c9A1sRoROSCa5QNFgkNBJibvcDL8pwTn6uic73GUgUMaM00LbJa7FLD04UHA]');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
            tailElem = $('#js_content img[data-src*=2zxaP93End3fKyGpO1OOOgugbO01rR9aXDLB14OSAb6h7RV3d3iamrhASftBiclDib5CYicickbync90zdEmkBpFlJw]');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }
        },
        '冯舟说地产': function () {
            $('img[data-src*=6L08iaaGX7obXiah74FtfiaCeEhTwf2nx8ke1SqgvKd9YLUJRhooykmOutm7icz6wPkqlmnxtRg1lDg9m2ReAPnDKw]').parent().remove();
            //名片：
            var tailElem;
            tailElem = $('#js_content p:contains("地产观察者，思考者，投资者")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            tailElem.remove();

            //底部视频
            tailElem = $('#js_content p:contains("了解我的故事，我眼中的新加坡")');
            while (tailElem.length > 0 && !(tailElem.parent().is('#js_content'))) {
                tailElem = tailElem.parent();
            }
            if (tailElem.length > 0) {
                do {
                    tailElem.next().remove();
                } while (tailElem.next().length);
                tailElem.remove();
            }

        },
    };
    //TODO: 躺倒鸭,奔波儿灞与灞波儿奔

    $(function () {
        // return;
        var CONTEXT = {
            author: ($('#js_name').text() || '').trim(),
            title: ($('#activity-name').text() || '').trim(),
            publishedAt: ($('#publish_time').text() || '').trim(),
        };
        /*
        关键字过滤 对正文误伤太严重
        $('p').each(function () {
            var $this = $(this);
            var text = $this.text() || '';
            $.each(KEYWORDS, function (idx, key) {
                if (text.indexOf(key)) {
                    $this.remove();
                }
            });
        });*/
        $.each(AUTHOR_FILTER, function (author, filter) {
            if ((CONTEXT.author || '').indexOf(author) > -1) {
                try {
                    filter();
                } catch (e) {
                    console.log(e.toString());
                }
            }
        });
        //过滤 图片
        $('img').each(function () {
            var $this = $(this);
            var src = $this.attr('src');
            var dataSrc = $this.attr('data-src');
            if (dataSrc && !/^http(s)?:\/\//.test(src)) {
                $this.attr('src', dataSrc);
            }
        });
        //过滤掉小程序推广卡片
        $('a.weapp_image_link').remove();
        $('a.weapp_text_link').remove();
        $('mp-miniprogram').parent().remove();

        //过滤视频内容
        window.__N_VIDEOS = window.__N_VIDEOS || {};
        $('iframe').each(function () {
            var $this = $(this);
            var vid = $this.attr('data-mpvid');
            if (!vid) {
                var src = $this.attr('src');
                var matches = src.match(/vid=([^&]*)&/);
                if (matches) {
                    vid = matches[1];
                }
            }
            var videoInfo = window.__N_VIDEOS[vid];
            if (videoInfo && videoInfo.src) {
                var video = $(`<video controls preload="none"></video>`);
                //src="${video.url}" 
                // data-id="${video.id}" 
                // data-news-id="${video.news_id}" 
                // data-source-type="${video.source_type}" 
                // data-related-id="${video.related_id}" 
                // data-cover-image="${cover}"

                var cover = '';
                if (video.cover_image) {
                    cover = JSON.stringify(cover);
                    cover = cover.replace(/"/g, '&quot;')
                }
                video.attr({
                    src: videoInfo.src,
                    'data-source-type': 1,
                    'data-cover-image': cover
                });
                $this.replaceWith(video);
            }
        });


        //去掉QQ Music
        $('.qqmusic_area').remove();
        //去掉wechat app card
        $('.weapp_card').remove();
    });
})();
