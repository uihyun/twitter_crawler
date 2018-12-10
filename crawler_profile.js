var request = require('request'),
    cheerio = require('cheerio'),
    fs = require('fs'),
    readline = require('readline'),
    config = require('./config'),
    deasync = require('deasync');

var showContents = config.showContents,
    outputType = config.outputType,
    brand = config.brand,
    sinceDate = config.sinceDate,
    untilDate = config.untilDate,
    header = config.header,
    withBrand = config.withBrand,
    withRangeFormat = config.withRangeFormat;

var count = 0;

function getProfile(line) {
    console.log("### start ###");

    var url = line.substring(line.lastIndexOf('","') + 3, line.length - 1);
    var tweetData = line.substring(0, line.lastIndexOf('","') + 1);
    
    var tweets = '';
    var following = '';
    var followers = '';
    var favorites = '';

    request(url, function (err, res, html) {
        if (err) return console.error(err);

        var $ = cheerio.load(html);
        $("ul.ProfileNav-list").each(function () {
            var data = $(this);
    
            tweets = data.find("li.ProfileNav-item.ProfileNav-item--tweets span.ProfileNav-value").text().trim().replace(/\r\n|\n|\r|\t/g,"").replace(/,/g,"");
            following = data.find("li.ProfileNav-item.ProfileNav-item--following span.ProfileNav-value").text().trim().replace(/\r\n|\n|\r|\t/g,"").replace(/,/g,"");
            followers = data.find("li.ProfileNav-item.ProfileNav-item--followers span.ProfileNav-value").text().trim().replace(/\r\n|\n|\r|\t/g,"").replace(/,/g,"");
            favorites = data.find("li.ProfileNav-item.ProfileNav-item--favorites span.ProfileNav-value").text().trim().replace(/\r\n|\n|\r|\t/g,"").replace(/,/g,"");

            if (showContents) {
                console.log('@@@@@ tweets ' + tweets);
                console.log('@@@@@ following ' + following);
                console.log('@@@@@ followers ' + followers);
                console.log('@@@@@ favorites ' + favorites);
            }
        });
    });

    while (true) {
        if (tweets.length != 0)
            break;
        else
            deasync.sleep(1000);
    }

    if (following.length == 0)
        following = 0;
    else if (followers.length == 0)
        followers = 0;
    else if (favorites.length == 0)
        favorites = 0;

    if (withRangeFormat) {
        if (tweets <= 100) {
            tweets = tweets + '","0~100';
        } else if (tweets <= 500) {
            tweets = tweets + '","101~500';
        } else if (tweets <= 1000) {
            tweets = tweets + '","501~1000';
        } else if (tweets <= 5000) {
            tweets = tweets + '","1001~5000';
        } else if (tweets <= 10000) {
            tweets = tweets + '","5001~10000';
        } else if (tweets <= 25000) {
            tweets = tweets + '","10001~25000';
        } else if (tweets <= 50000) {
            tweets = tweets + '","25001~50000';
        } else if (tweets > 50000) {
            tweets = tweets + '","50001~';
        } else {
            tweets = tweets + '","0~100';
        }

        if (following <= 100) {
            following = following + '","0~100';
        } else if (following <= 500) {
            following = following + '","101~500';
        } else if (following <= 1000) {
            following = following + '","501~1000';
        } else if (following <= 5000) {
            following = following + '","1001~5000';
        } else if (following <= 10000) {
            following = following + '","5001~10000';
        } else if (following <= 25000) {
            following = following + '","10001~25000';
        } else if (following <= 50000) {
            following = following + '","25001~50000';
        } else if (following > 50000) {
            following = following + '","50001~';
        } else {
            following = following + '","0~100';
        }

        if (followers <= 100) {
            followers = followers + '","0~100';
        } else if (followers <= 500) {
            followers = followers + '","101~500';
        } else if (followers <= 1000) {
            followers = followers + '","501~1000';
        } else if (followers <= 5000) {
            followers = followers + '","1001~5000';
        } else if (followers <= 10000) {
            followers = followers + '","5001~10000';
        } else if (followers <= 25000) {
            followers = followers + '","10001~25000';
        } else if (followers <= 50000) {
            followers = followers + '","25001~50000';
        } else if (followers > 50000) {
            followers = followers + '","50001~';
        } else {
            followers = followers + '","0~100';
        }

        if (favorites <= 100) {
            favorites = favorites + '","0~100';
        } else if (favorites <= 500) {
            favorites = favorites + '","101~500';
        } else if (favorites <= 1000) {
            favorites = favorites + '","501~1000';
        } else if (favorites <= 5000) {
            favorites = favorites + '","1001~5000';
        } else if (favorites <= 10000) {
            favorites = favorites + '","5001~10000';
        } else if (favorites <= 25000) {
            favorites = favorites + '","10001~25000';
        } else if (favorites <= 50000) {
            favorites = favorites + '","25001~50000';
        } else if (favorites > 50000) {
            favorites = favorites + '","50001~';
        } else {
            favorites = favorites + '","0~100';
        }
    }

    // write
    if (outputType === 0) {
        // write json
        fs.appendFile('store_lowes.json',  JSON.stringify(post) + ',\n', 'utf-8', function (err) {
            if (err) throw err;
            else console.log("### saved item and reply " + count + " ###");
        });
    } else if (outputType === 1) {
        // write csv
        if (!withBrand)
            fs.appendFile('sns_twitter_' + sinceDate + '_' + untilDate + '_profile.csv',  tweetData + ',"' + tweets + '","' + following +
            '","' + followers + '","' + favorites + '"\n', 'utf-8', function (err) {
                if (err) throw err;
                else console.log("### saved tweet " + count + " ###");
            });
        else
            fs.appendFile('sns_twitter_' + brand + '_' + sinceDate + '_' + untilDate + '_profile.csv',  tweetData + ',"' + tweets + '","' + following +
            '","' + followers + '","' + favorites + '"\n', 'utf-8', function (err) {                        
                if (err) throw err;
                else console.log("### saved tweet " + count + " ###");
            });
    }

    count++;
};

// read csv
if (outputType === 1) {
    var rd = readline.createInterface({
        input: fs.createReadStream('sns_twitter_' + sinceDate + '_' + untilDate + '.csv', 'utf-8'),
        output: process.stdout,
        console: false
    });
    
    rd.on('line', function(line) {
        if (showContents)
            console.log(line);
            
        // write csv header
        if (outputType === 1 && header) {
            var columns = '';
            if (!withRangeFormat)
                columns = line + ',tweets,following,followers,favorites\n';
            else
                columns = line + ',tweets,tweetsrange,following,followingrange,followers,followersrange,favorites,favoritesrange\n';
            
            fs.writeFile('sns_twitter_' + sinceDate + '_' + untilDate + '_profile.csv', columns, 'utf-8', function (err) {            
                if (err) throw err;
                console.log("### saved header ###");
            });

            header = false;
            return;
        }

        getProfile(line);
    });
}



