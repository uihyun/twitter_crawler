var fs = require('fs'),
    config = require('./config'),
    webdriver = require('selenium-webdriver'),
    dateFormat = require('dateformat'),
    deasync = require('deasync');

var showContents = config.showContents,
    outputType = config.outputType,
    brand = config.brand,
    products = config.products,
    sinceDate = config.sinceDate,
    untilDate = config.untilDate,
    header = config.header,
    withBrand = config.withBrand,
    numberFormat = config.numberFormat;

var posts = new Array();

function getArticle(product) {
    console.log("### start ###");
    
    var url;
    if (!withBrand)
        url = "https://twitter.com/search?q=" + product.replace(' ', '%20') + "%20since%3A" + sinceDate + "%20until%3A" + untilDate + "&amp;amp;amp;amp;amp;amp;lang=eg";
    else
        url = "https://twitter.com/search?q=" + brand + "%20" + product.replace(' ', '%20') + "%20since%3A" + sinceDate + "%20until%3A" + untilDate + "&amp;amp;amp;amp;amp;amp;lang=eg";
    
    var driver = new webdriver.Builder()
    .forBrowser('chrome')
    // .setChromeOptions(/* ... */)
    .build();

    driver.get(url);
    
    var By = webdriver.By;    
    var lastHeight = 0;
    var newHeight = 0;
    var isEnd = false;

    driver.executeScript('return document.body.scrollHeight')
    .then(function(return_value) {
        newHeight = return_value;
        console.log('returned ', return_value)
        isEnd = true;
    });

    while(!isEnd) {
        deasync.sleep(100);
    }
    isEnd = false;

    while(lastHeight != newHeight) {
        lastHeight = newHeight;
        driver.executeScript('window.scrollTo(0, document.body.scrollHeight)')
        .then(function(return_value) {
            console.log('returned ', 'scroll okay')
            isEnd = true;
        }).catch((e) => {
            isEnd = true;
            console.log('webdriver executeScript error');
        });

        while(!isEnd) {
            deasync.sleep(10000);
        }
        isEnd = false;
        
        driver.executeScript('return document.body.scrollHeight')
        .then(function(return_value) {
            newHeight = return_value;            
            console.log('returned ', return_value)
            isEnd = true;
        }).catch((e) => {
            isEnd = true;
            console.log('webdriver executeScript error');
        });
        
        while(!isEnd) {
            deasync.sleep(10000);
        }
        isEnd = false;

        if (lastHeight == newHeight)
            isEnd = true;
    }

    while(!isEnd) {
        deasync.sleep(10000);
    }
    isEnd = false;

    driver.executeScript('return document.body.scrollHeight')
    .then(function(return_value) {
        console.log('final returned ', return_value)
        isEnd = true;
    }).catch((e) => {
        isEnd = true;
        console.log('webdriver executeScript error');
    });
    
    while(!isEnd) {
        deasync.sleep(10000);
    }
    isEnd = false;

    var count = 0;
    var elements = driver.findElements(By.className('content'));
    elements.then(function (elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].getText().then(function (value) {
                if (showContents)
                    console.log(value);
                
                var name = value.substring(0, value.indexOf('\n')).trim();
                var id = '';
                if (!name.startsWith('@')) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    id = value.substring(0, value.indexOf('\n')).trim();
                } else {
                    id = name;
                }
                while (!id.startsWith('@')) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    id = value.substring(0, value.indexOf('\n')).trim();
                }
                if (id.startsWith('@'))
                    id = id.substring(1, id.length);

                value = value.substring(value.indexOf('\n') + 1, value.length);
                var date = value.substring(0, value.indexOf('\n')).trim();
                if (date.endsWith('h')) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    date = value.substring(0, value.indexOf('\n')).trim();
                }
                
                value = value.substring(value.indexOf('\n') + 1, value.length);
                value = value.substring(value.indexOf('\n') + 1, value.length);
                var replyTo = value.substring(0, value.indexOf('\n')).trim();
                while (replyTo.startsWith('Replying to') || replyTo.startsWith('https://') || replyTo.length == 0) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    replyTo = value.substring(0, value.indexOf('\n')).trim();
                }
                var body = value.substring(0, value.indexOf('\nReply\n')).trim().replace(/\r\n|\n|\r|\t/g," ").replace(/\"/g,"\"\"");;
                value = value.substring(value.indexOf('\nReply\n') + 1, value.length);

                value = value.substring(value.indexOf('\n') + 1, value.length);
                var replyCount = value.substring(0, value.indexOf('\n')).trim();
                if (replyCount == 'Retweet') {
                    replyCount = 0;
                } else {
                    value = value.substring(value.indexOf('\n') + 1, value.length);                    
                }
                value = value.substring(value.indexOf('\n') + 1, value.length);
                
                var retweetCount = value.substring(0, value.indexOf('\n')).trim();
                if (retweetCount == 'Like') {
                    retweetCount = 0;
                } else if (retweetCount.length == 0) {
                    retweetCount = 0;
                } else {
                    value = value.substring(value.indexOf('\n') + 1, value.length);                    
                }
                value = value.substring(value.indexOf('\n') + 1, value.length);
                
                var likeCount = value.substring(0, value.length).trim();
                if (likeCount == 'Show this thread' || likeCount == 'Like') {
                    likeCount = 0;
                } else if (likeCount.length == 0) {
                    likeCount = 0;
                }

                if (showContents) {
                    console.log('@@@@@ name ', name);
                    console.log('@@@@@ id ', id);
                    console.log('@@@@@ date ', date);
                    console.log('@@@@@ body ', body);
                    console.log('@@@@@ replyCount ', replyCount);
                    console.log('@@@@@ retweetCount ', retweetCount);
                    console.log('@@@@@ likeCount ', likeCount);
                }

                if (numberFormat == 1) {
                    if (replyCount <= 100) {
                        replyCount = "0~100";
                    } else if (replyCount <= 500) {
                        replyCount = "101~500";
                    } else if (replyCount <= 1000) {
                        replyCount = "501~1000";
                    } else if (replyCount <= 5000) {
                        replyCount = "1001~5000";
                    } else if (replyCount <= 10000) {
                        replyCount = "5001~10000";
                    } else if (replyCount > 10000) {
                        replyCount = "10001~";
                    } else {
                        replyCount = "0";
                    }

                    if (retweetCount <= 100) {
                        retweetCount = "0~100";
                    } else if (retweetCount <= 500) {
                        retweetCount = "101~500";
                    } else if (retweetCount <= 1000) {
                        retweetCount = "501~1000";
                    } else if (retweetCount <= 5000) {
                        retweetCount = "1001~5000";
                    } else if (retweetCount <= 10000) {
                        retweetCount = "5001~10000";
                    } else if (retweetCount > 10000) {
                        retweetCount = "10001~";
                    } else {
                        retweetCount = "0";
                    }

                    if (likeCount <= 100) {
                        likeCount = "0~100";
                    } else if (likeCount <= 500) {
                        likeCount = "101~500";
                    } else if (likeCount <= 1000) {
                        likeCount = "501~1000";
                    } else if (likeCount <= 5000) {
                        likeCount = "1001~5000";
                    } else if (likeCount <= 10000) {
                        likeCount = "5001~10000";
                    } else if (likeCount > 10000) {
                        likeCount = "10001~";
                    } else {
                        likeCount = "0";
                    }
                }

                var seq = '';
                if (!withBrand)
                    seq = product.replace(' ', '_') + '_' + count;
                else
                    seq = brand + '_' + product.replace(' ', '_') + '_' + count;
                
                // write
                // seq,writername,writerid,date,body,replycount,retweetcount,likecount
                if (outputType === 0) {
                    // write json
                    fs.appendFile('store_lowes.json',  JSON.stringify(post) + ',\n', 'utf-8', function (err) {
                        if (err) throw err;
                        else console.log("### saved item and reply " + count + " ###");
                    });
                } else if (outputType === 1) {
                    var brandStr = brand.toUpperCase();
                    if (withBrand) {
                        if (brand == 'samsung')
                            brandStr = 'Samsung';
                        else if (brand == 'whirlpool')
                            brandStr = 'Whirlpool';
                    }


                    // write csv
                    if (!withBrand)
                        fs.appendFile('sns_twitter_' + sinceDate + '_' + untilDate + '.csv',  '"' + seq + '","' + name + '","' + id + '","' + date +                     
                        '","' + body + '","' + replyCount + '","' + retweetCount + '","' + likeCount + '","Twitter"\n', 'utf-8', function (err) {
                            if (err) throw err;
                            else console.log("### saved tweet " + count + " ###");
                        });
                    else
                        fs.appendFile('sns_twitter_' + brand + '_' + sinceDate + '_' + untilDate + '.csv',  '"' + seq + '","' + name + '","' + id + '","' + date + 
                        '","' + body + '","' + replyCount + '","' + retweetCount + '","' + likeCount + '","' +  brandStr + '","Twitter"\n', 'utf-8', function (err) {                        
                            if (err) throw err;
                            else console.log("### saved tweet " + count + " ###");
                        });
                }

                count++;
            });
        }
    });
    
};

// write csv header
if (outputType === 1 && header) {
    if (!withBrand)
        fs.writeFile('sns_twitter_' + sinceDate + '_' + untilDate + '.csv', 'seq,writername,writerid,date,body,replycount,retweetcount,likecount,site\n', 'utf-8', function (err) {            
            if (err) throw err;
            console.log("### saved header ###");
        });
    else
        fs.writeFile('sns_twitter_' + brand + '_' + sinceDate + '_' + untilDate + '.csv', 'seq,writername,writerid,date,body,replycount,retweetcount,likecount,brand,site\n', 'utf-8', function (err) {
            if (err) throw err;
            console.log("### saved header ###");
        });
}

var productArray = products.split(',');
for (var p = 0; p < productArray.length; p++) {
    getArticle(productArray[p]);
}

