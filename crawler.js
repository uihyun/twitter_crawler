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
    withRangeFormat = config.withRangeFormat,
    count = config.beginOffset;

var fileName = '';

function getTweet(productQuery, brandQuery) {
    console.log("### start ###");
    
    var query = '';
    if (untilDate != '') {
        if (!withBrand)
            query = productQuery + "%20since%3A" + sinceDate + "%20until%3A" + untilDate + "&l=en&f=tweets";
        else
            query = "(" + productQuery + ")%20(" + brandQuery + ")%20since%3A" + sinceDate + "%20until%3A" + untilDate + "&l=en&f=tweets";
    } else {
        if (!withBrand)
            query = productQuery + "%20since%3A" + sinceDate + "&l=en&f=tweets";
        else
            query = "(" + productQuery + ")%20(" + brandQuery + ")%20since%3A" + sinceDate + "&l=en&f=tweets";
    }
    
    var url = "https://twitter.com/search?q=" + query;
    
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
        deasync.sleep(1000);
    }
    deasync.sleep(10000);
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
            deasync.sleep(1000);
        }
        deasync.sleep(10000);
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
            deasync.sleep(1000);
        }
        deasync.sleep(10000);
        isEnd = false;

        if (lastHeight == newHeight)
            isEnd = true;
    }

    while(!isEnd) {
        deasync.sleep(1000);
    }
    deasync.sleep(10000);
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
        deasync.sleep(1000);
    }
    deasync.sleep(10000);
    isEnd = false;

    var elements = driver.findElements(By.className('content'));
    elements.then(function (elements) {
        for (var i = 0; i < elements.length; i++) {
            elements[i].getText().then(function (value) {
                if (showContents)
                    console.log(value);
                
                var name = value.substring(0, value.indexOf('\n')).trim().replace(/\r\n|\n|\r|\t/g,"").replace(/\"/g,"");
                var id = '';
                if (!name.startsWith('@')) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    id = value.substring(0, value.indexOf('\n')).trim().replace(/\r\n|\n|\r|\t/g,"").replace(/\"/g,"");
                } else {
                    id = name;
                }
                while (!id.startsWith('@')) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    id = value.substring(0, value.indexOf('\n')).trim().replace(/\r\n|\n|\r|\t/g,"").replace(/\"/g,"");
                }
                if (id.startsWith('@'))
                    id = id.substring(1, id.length);

                var profileLink = 'https://twitter.com/' + id;

                value = value.substring(value.indexOf('\n') + 1, value.length);
                var date = value.substring(0, value.indexOf('\n')).trim();
                if (date.split(' ').length > 1) {
                    date = date + ' ' + untilDate.substring(0, 4);
                // } else if (date.endsWith('h') || date.endsWith('m') || date.endsWith('s')) {
                } else if (date.endsWith('h')) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    // date = value.substring(0, value.indexOf('\n')).trim();
                    var now = new Date();
                    now.setHours(now.getHours - date.substring(0, date.indexOf('h')));
                    date = now.getDate();
                } else {
                    date = new Date();
                }
                date = dateFormat(date, 'isoDate');
                
                value = value.substring(value.indexOf('\n') + 1, value.length);
                value = value.substring(value.indexOf('\n') + 1, value.length);
                var replyTo = value.substring(0, value.indexOf('\n')).trim();
                while (replyTo.startsWith('Replying to') || replyTo.startsWith('https://') || replyTo.length == 0) {
                    value = value.substring(value.indexOf('\n') + 1, value.length);
                    replyTo = value.substring(0, value.indexOf('\n')).trim();
                }
                var body = value.substring(0, value.indexOf('\nReply\n')).trim().replace(/\r\n|\n|\r|\t/g," ").replace(/\"/g,"\"\"");
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
                if (likeCount.indexOf('\n') > -1) {
                    likeCount = value.substring(0, likeCount.indexOf('\n')).trim();
                } else if (likeCount == 'Show this thread' || likeCount == 'Like') {
                    likeCount = 0;
                } else if (likeCount.length == 0) {
                    likeCount = 0;
                }

                if (replyCount.length == 0)
                    replyCount = 0;
                if (retweetCount.length == 0)
                    retweetCount = 0;
                if (likeCount.length == 0)
                    likeCount = 0;

                if (showContents) {
                    console.log('@@@@@ name ', name);
                    console.log('@@@@@ id ', id);
                    console.log('@@@@@ date ', date);
                    console.log('@@@@@ body ', body);
                    console.log('@@@@@ replyCount ', replyCount);
                    console.log('@@@@@ retweetCount ', retweetCount);
                    console.log('@@@@@ likeCount ', likeCount);
                    console.log('@@@@@ profileLink ', profileLink);
                }

                if (withRangeFormat) {
                    if (replyCount <= 50) {
                        replyCount = replyCount + '","0~50';
                    } else if (replyCount <= 100) {
                        replyCount = replyCount + '","51~100';
                    } else if (replyCount <= 500) {
                        replyCount = replyCount + '","101~500';
                    } else if (replyCount <= 1000) {
                        replyCount = replyCount + '","501~1000';
                    } else if (replyCount <= 5000) {
                        replyCount = replyCount + '","1001~5000';
                    } else if (replyCount <= 10000) {
                        replyCount = replyCount + '","5001~10000';
                    } else if (replyCount <= 25000) {
                        replyCount = replyCount + '","10001~25000';
                    } else if (replyCount <= 50000) {
                        replyCount = replyCount + '","25001~50000';
                    } else if (replyCount > 50000) {
                        replyCount = replyCount + '","50001~';
                    } else {
                        replyCount = replyCount + '","0~50';
                    }

                    if (retweetCount <= 50) {
                        retweetCount = retweetCount + '","0~50';
                    } else if (retweetCount <= 100) {
                        retweetCount = retweetCount + '","51~100';
                    } else if (retweetCount <= 500) {
                        retweetCount = retweetCount + '","101~500';
                    } else if (retweetCount <= 1000) {
                        retweetCount = retweetCount + '","501~1000';
                    } else if (retweetCount <= 5000) {
                        retweetCount = retweetCount + '","1001~5000';
                    } else if (retweetCount <= 10000) {
                        retweetCount = retweetCount + '","5001~10000';
                    } else if (retweetCount <= 25000) {
                        retweetCount = retweetCount + '","10001~25000';
                    } else if (retweetCount <= 50000) {
                        retweetCount = retweetCount + '","25001~50000';
                    } else if (retweetCount > 50000) {
                        retweetCount = retweetCount + '","50001~';
                    } else {
                        retweetCount = retweetCount + '","0~50';
                    }

                    if (likeCount <= 50) {
                        likeCount = likeCount + '","0~50';
                    } else if (likeCount <= 100) {
                        likeCount = likeCount + '","51~100';
                    } else if (likeCount <= 500) {
                        likeCount = likeCount + '","101~500';
                    } else if (likeCount <= 1000) {
                        likeCount = likeCount + '","501~1000';
                    } else if (likeCount <= 5000) {
                        likeCount = likeCount + '","1001~5000';
                    } else if (likeCount <= 10000) {
                        likeCount = likeCount + '","5001~10000';
                    } else if (likeCount <= 25000) {
                        likeCount = likeCount + '","10001~25000';
                    } else if (likeCount <= 50000) {
                        likeCount = likeCount + '","25001~50000';
                    } else if (likeCount > 50000) {
                        likeCount = likeCount + '","50001~';
                    } else {
                        likeCount = likeCount + '","0~50';
                    }
                }

                var seq = 'washer_' + date + '_' + count;
                
                // write
                // seq,writername,writerid,date,body,replycount,retweetcount,likecount,site,profilelink
                if (outputType === 0) {
                    // write json
                    fs.appendFile('sns_twitter.json',  JSON.stringify(post) + ',\n', 'utf-8', function (err) {
                        if (err) throw err;
                        else {
                            console.log("### saved tweet " + count + " ###");
                            count++;
                            if (count == elements.length)
                                driver.quit();
                        }
                    });
                } else if (outputType === 1) {
                    // write csv
                    fs.appendFile(fileName,  '"' + seq + '","' + name + '","' + id + '","' + date +                     
                    '","' + body + '","' + replyCount + '","' + retweetCount + '","' + likeCount + '","Twitter","' + profileLink + '"\n', 'utf-8', function (err) {
                        if (err) throw err;
                        else {
                            console.log("### saved tweet " + count + " ###");
                            count++;
                            if (count == elements.length)
                                driver.quit();
                        }
                    });
                }
            });
        }
    });
};

var productArray = products.split(',');
var productQuery = '';
for (var p = 0; p < productArray.length; p++) {
    productQuery += '"' + productArray[p] + '"'
    if (p != productArray.length - 1)
        productQuery += '%20OR%20'
}

var brandArray = brand.split(',');
var brandQuery = '';
for (var p = 0; p < brandArray.length; p++) {
    brandQuery += '"' + brandArray[p] + '"'
    if (p != brandArray.length - 1)
        brandQuery += '%20OR%20'
}
brand = 'brand';

// write csv header
if (outputType === 1 && header) {
    var columns = '';
    if (!withBrand) {
        fileName = 'sns_twitter_' + sinceDate + '_' + untilDate + '.csv';
        if (!withRangeFormat)
            columns = 'seq,writername,writerid,date,body,replycount,retweetcount,likecount,site,profilelink\n';
        else
            columns = 'seq,writername,writerid,date,body,replycount,replyrange,retweetcount,retweetrange,likecount,likerange,site,profilelink\n';
    }
    else {
        fileName = 'sns_twitter_' + brand + '_' + sinceDate + '_' + untilDate + '.csv';
        if (!withRangeFormat)
            columns = 'seq,writername,writerid,date,body,replycount,retweetcount,likecount,brand,site,profilelink\n';
        else
            columns = 'seq,writername,writerid,date,body,replycount,replyrange,retweetcount,retweetrange,likecount,likerange,brand,site,profilelink\n';
    }
    
    fs.writeFile(fileName, columns, 'utf-8', function (err) {            
        if (err) throw err;
        console.log("### saved header ###");
    });
}

getTweet(productQuery, brandQuery);