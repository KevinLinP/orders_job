const unirest = require('unirest');
const jsonfile = require('jsonfile');
const _ = require('underscore');

class Stubhub {
  constructor() {
    this.accessToken = process.env.STUBHUB_ACCESS_TOKEN;
  }

  printAccessTokens() {
    const credentials = jsonfile.readFileSync('./credentials/stubhub.json');
    const basicAuthToken = new Buffer(`${credentials.consumerKey}:${credentials.consumerSecret}`).toString('base64');
    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${basicAuthToken}`
    }

    unirest.post('https://api.stubhub.com/login')
      .headers(headers)
      .send(`grant_type=password&username=${credentials.login}&password=${credentials.password}&scope=PRODUCTION`)
      .end(function (response) {
        console.log(response.code);
        console.log(response.body);
      });
  }

  call(path, callback) {
    const url = `https://api.stubhub.com${path}`;
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json',
      'Accept-Encoding': 'application/json'
    };

    unirest.get(url)
      .headers(headers)
      .end(callback);
  }

  getListings(path, start, callback) {
    const rows = 100;

    const responseHandler = (response) => {
      if (response.code != 200) {
        console.log(response);
      } else {
        const data = response.body;
        if (data.totalListings > (start + rows)) {
          setTimeout(() => {
            this.getListings(path, (start + rows), callback);
          }, 500);
        }

        const listings = this.simplifyListings(data.listing);
        callback(listings);
      }
    };

    this.call(path + `&rows=${rows}&start=${start}`, responseHandler);
  }

  simplifyListings(listings) {
    let simpleListings = _.map(listings, (listing) => {
      if (listing.currentPrice.currency != 'USD') {
        console.log(listing.currentPrice);
        return null;
      }

      return {
        externalId: listing.listingId.toString(),
        quantity: listing.quantity,
        price: listing.currentPrice.amount
      };
    });

    simpleListings = _.compact(simpleListings);

    return simpleListings;
  }
}

module.exports = Stubhub;
