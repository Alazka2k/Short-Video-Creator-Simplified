/**
 * Subscription Service Entry Point
 * 
 * This file initializes the service and all its components.
 */

const logger = require('../../shared/utils/logger');
const server = require('./server');
const config = require('../../shared/utils/config');

// Import data access classes
const PlansDataAccess = require('./data/plansDataAccess');
const SubscriptionsDataAccess = require('./data/subscriptionsDataAccess');
const TokenTransactionsDataAccess = require('./data/tokenTransactionsDataAccess');
const TokenPackagesDataAccess = require('./data/tokenPackagesDataAccess');
const TokenBalanceDataAccess = require('./data/tokenBalanceDataAccess');
const PaymentsDataAccess = require('./data/paymentsDataAccess');

// Import service classes
const PlanService = require('./services/planService');
const SubscriptionService = require('./services/subscriptionService');
const TokenService = require('./services/tokenService');
const TokenPackageService = require('./services/tokenPackageService');
const PaymentService = require('./services/paymentService');
const TransactionService = require('./services/transactionService');

// Import controllers
const PlanController = require('./controllers/planController');
const SubscriptionController = require('./controllers/subscriptionController');
const TokenController = require('./controllers/tokenController');
const TokenPackageController = require('./controllers/tokenPackageController');
const PaymentController = require('./controllers/paymentController');
const WebhookController = require('./controllers/webhookController');
const TransactionController = require('./controllers/transactionController');

// Import utilities
const TokenCalculator = require('./utils/tokenCalculator');
const StripeService = require('./utils/stripeService');

// Data access layer
const dataAccess = {
  plans: PlansDataAccess,
  subscriptions: SubscriptionsDataAccess,
  tokenTransactions: TokenTransactionsDataAccess,
  tokenPackages: TokenPackagesDataAccess,
  tokenBalance: new TokenBalanceDataAccess(),
  payments: PaymentsDataAccess
};

// Utilities
const tokenCalculator = TokenCalculator;
const stripeService = StripeService;

async function startServer() {
  try {
    logger.info('Starting Subscription Service...');
    
    // Initialize utilities
    await tokenCalculator.initialize();
    await stripeService.initialize();
    
    // Initialize services
    const subscriptionService = new SubscriptionService(dataAccess);
    const planService = new PlanService(dataAccess);
    const tokenService = new TokenService(dataAccess, tokenCalculator);
    const paymentService = new PaymentService(dataAccess, stripeService);
    const tokenPackageService = new TokenPackageService(dataAccess, paymentService);
    const transactionService = new TransactionService(dataAccess, tokenCalculator);
    
    // Initialize controllers
    const planController = new PlanController(planService);
    const subscriptionController = new SubscriptionController(subscriptionService);
    const tokenController = new TokenController(tokenService);
    const tokenPackageController = new TokenPackageController(tokenPackageService);
    const paymentController = new PaymentController(paymentService);
    const webhookController = new WebhookController(paymentService);
    const transactionController = new TransactionController(transactionService);
    
    // Create and start the server
    const app = server.createServer({
      planController,
      subscriptionController,
      tokenController,
      tokenPackageController,
      paymentController,
      webhookController,
      transactionController
    });
    
    // Get port from config, or use 3010 as a fallback
    let PORT;
    try {
      // First check for environment variable
      PORT = process.env.SUBSCRIPTION_SERVICE_PORT;
      
      // If not found, try to extract from config url
      if (!PORT) {
        const serviceUrl = config.services?.subscription?.url || '';
        const portMatch = serviceUrl.match(/:(\d+)$/);
        PORT = portMatch ? parseInt(portMatch[1]) : 3010;
      }
    } catch (error) {
      PORT = 3010;
      logger.warn(`Could not parse port from config, using default port ${PORT}`);
    }

    app.listen(PORT, () => {
      logger.info(`Subscription Service running on port ${PORT}`);
    });
    
    // Handle graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down Subscription Service...');
      process.exit(0);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Failed to start Subscription Service:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer }; 