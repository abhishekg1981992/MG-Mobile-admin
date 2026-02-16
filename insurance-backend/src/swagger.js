// helper to view swagger locally (node src/swagger.js)
import express from 'express';
import YAML from 'yamljs';
import swaggerUi from 'swagger-ui-express';
const app = express();
const swaggerDocument = YAML.load('./src/docs/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.listen(3001, () => console.log('Swagger available at http://localhost:3001/api-docs'));
