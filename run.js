const Stubhub = require('./stubhub.js');
const OrdersUpdater = require('./orders-updater.js');
const Raven = require('raven');

Raven.config(process.env.SENTRY_DSN).install();

Raven.context(() => {
  const url = `/search/inventory/v2?eventid=${103006757}&sectionidlist=${592805}`;
  const stubhub = new Stubhub();

  stubhub.getListings(url, 0, (orders) => {
    const ordersUpdater = new OrdersUpdater(orders);
    ordersUpdater.updateAll();
  });
});
