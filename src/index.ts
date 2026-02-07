import app from './app';
import { connectDB } from './DB/connection';
import { cronService } from './services/cron.service';

const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to database
        await connectDB();

        // Start cron jobs
        cronService.start();

        // Start server
        app.listen(PORT, () => {
            console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🏢 Property Management API                          ║
║                                                       ║
║   🚀 Server running on port ${PORT}                     ║
║   📊 Environment: ${process.env.NODE_ENV || 'development'}                    ║
║   🔗 API: http://localhost:${PORT}/api/v1               ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
    console.error('Unhandled Rejection:', error);
    process.exit(1);
});

startServer();
