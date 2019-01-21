const request = require('request');
const Bluebird = require('bluebird');
const get = Bluebird.promisify(request.get);
const fs = Bluebird.promisifyAll(require('fs'));
let HTMLParser = require("htmlparser2");


async function scanPage(url) {
    // return if hrefs doesnt has medium as a host
    if(!url.includes("medium.com")) {
        return;
    }
    // read href stored file
    let href_file = await fs.readFileAsync("link_store.txt");
    if (href_file.includes(url)) {
        console.log(url)
        return;
    }
    // retrun request prmoise
    return get(url).then(async (res) => {
        try {
            let arrayOfLinks = []

            //response body
            let body = res.body;

            // html parsing
            const parser = new HTMLParser.Parser({
                onopentag: function(name, attribs){
                    if(name === "a"){
                        if(attribs.href.includes("http")) {
                            arrayOfLinks.push(attribs.href);
                        }
                    }
                }
            }, {decodeEntities: true});

            parser.parseChunk(body);
            console.log(arrayOfLinks);

            // iterate thorough DOM hrefs
            for(let i = 0; i < arrayOfLinks.length; i++) {
                let href = arrayOfLinks[i];

                await fs.appendFileAsync('link_store.txt', href + ',');
            }

            // recursively scan hrefs with 5 concurrent connections
            return Bluebird.map(arrayOfLinks, scanPage, { concurrency: 5 })
                .then(results => {
                    let res = {};
                    for (let i = 0; i < results.length; i++)
                        res[arrayOfLinks[i]] = results[i];
                    return res;
                });
        } catch (error) {
            console.error(error);
        }

    });

}


scanPage("https://medium.com/").then((res) => {

}).catch((error) => {
    console.error(error);
})