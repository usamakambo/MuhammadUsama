import { app, subscriptionService } from './app.js';
import { config } from './common/config.js';

// check for due renewals once an hour
setInterval(
  () => subscriptionService.processRenewals().catch((err) => console.error(err)),
  60 * 60 * 1000,
);

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});
