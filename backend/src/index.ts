import express from 'express';
const cors = require('cors');
import userRoutes from './routes/user.routes';
import { PORT } from './config/env';
import { logger } from './utils/logger';

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',  // URL frontend SvelteKit
  credentials: true,
}));
app.use(express.json());

app.use('/api/users', userRoutes);

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
