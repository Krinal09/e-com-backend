const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox",
  client_id: "AQ5i3ytDppWVIRmJvWM9PqphzyxYioCTzyUh-_boJNjk2jg4UQs0EqdlEFiX0Bjh4qxHC4XADe2O7tV_",
  client_secret: "ELjIQdf2U38QBiY0_osa0waH2E3bkYrrt8QXls1PIwhohTtvvU0gG7_tAJ1iITn3sj-ThQYlqEXNOaBz",
});

module.exports = paypal;
