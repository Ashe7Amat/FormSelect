// server.js
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const port = 3000;

// Configuración de Swagger
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "API de Formularios",
      version: "1.0.0",
      description: "API para gestionar formularios",
      contact: {
        name: "API Support"
      },
      servers: [{ url: `http://localhost:${port}` }]
    }
  },
  apis: ["./server.js"]
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middleware
app.use(cors()); // Habilitar CORS para todas las solicitudes
app.use(bodyParser.json()); // Para analizar cuerpos de solicitud JSON

// Cadena de conexión a MongoDB
const dbURI = "mongodb://localhost:27017/formioDb";

mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Conectado a MongoDB"))
  .catch((err) => console.error("Error de conexión a MongoDB:", err));

// Definir el esquema del formulario
const formularioSchema = new mongoose.Schema({
  formId: { type: String, required: true, unique: true },
  formDefinition: { type: Object, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Crear el modelo basado en el esquema
const Formulario = mongoose.model("Formulario", formularioSchema);

/**
 * @swagger
 * /forms:
 *   post:
 *     summary: Crear un nuevo formulario
 *     tags: [Formularios]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formId
 *               - formDefinition
 *             properties:
 *               formId:
 *                 type: string
 *               formDefinition:
 *                 type: object
 *     responses:
 *       201:
 *         description: Formulario creado exitosamente
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
app.post('/forms', async (req, res) => {
  try {
    const { formId, formDefinition } = req.body;

    if (!formId || !formDefinition) {
      return res.status(400).json({ 
        message: "Se requiere 'formId' y 'formDefinition' en el cuerpo de la petición." 
      });
    }

    // Verificar si ya existe un formulario con el mismo formId
    const existingForm = await Formulario.findOne({ formId });
    if (existingForm) {
      return res.status(409).json({ 
        message: "Ya existe un formulario con ese formId." 
      });
    }

    const newForm = new Formulario({
      formId,
      formDefinition
    });

    const savedForm = await newForm.save();
    res.status(201).json(savedForm);

  } catch (error) {
    console.error("Error al guardar:", error);
    res.status(500).json({ message: "Error al guardar.", error: error.message });
  }
});

/**
 * @swagger
 * /forms:
 *   get:
 *     summary: Obtener todos los formularios
 *     tags: [Formularios]
 *     responses:
 *       200:
 *         description: Lista de todos los formularios
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Formulario'
 *       500:
 *         description: Error del servidor
 */
app.get('/forms', async (req, res) => {
  try {
    const allForms = await Formulario.find().sort({ createdAt: -1 });
    res.status(200).json(allForms);
  } catch (error) {
    console.error("Error al obtener los formularios:", error);
    res.status(500).json({ message: "Error al obtener la lista de formularios.", error: error.message });
  }
});

/**
 * @swagger
 * /forms/{id}:
 *   get:
 *     summary: Obtener un formulario por ID
 *     tags: [Formularios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del formulario a buscar
 *     responses:
 *       200:
 *         description: Formulario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Formulario'
 *       404:
 *         description: Formulario no encontrado
 *       500:
 *         description: Error del servidor
 */
app.get('/forms/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Intentar buscar primero por el _id de MongoDB
    let form = await Formulario.findById(id).catch(() => null);
    
    // Si no se encuentra, buscar por formId
    if (!form) {
      form = await Formulario.findOne({ formId: id });
    }

    if (!form) {
      return res.status(404).json({ message: "Formulario no encontrado." });
    }

    res.status(200).json(form);

  } catch (error) {
    console.error("Error al obtener el formulario:", error);
    res.status(500).json({ message: "Error al obtener el formulario.", error: error.message });
  }
});

/**
 * @swagger
 * /forms/{id}:
 *   put:
 *     summary: Actualizar un formulario por ID
 *     tags: [Formularios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del formulario a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - formDefinition
 *             properties:
 *               formDefinition:
 *                 type: object
 *     responses:
 *       200:
 *         description: Formulario actualizado exitosamente
 *       400:
 *         description: Datos inválidos
 *       404:
 *         description: Formulario no encontrado
 *       500:
 *         description: Error del servidor
 */
app.put('/forms/:id', async (req, res) => {
  const id = req.params.id;
  const { formDefinition } = req.body;

  if (!formDefinition) {
    return res.status(400).json({ message: "Se requiere 'formDefinition' en el cuerpo de la petición." });
  }

  try {
    // Intentar actualizar primero por el _id de MongoDB
    let updatedForm = await Formulario.findByIdAndUpdate(
      id,
      { formDefinition },
      { new: true, runValidators: true }
    ).catch(() => null);
    
    // Si no se encuentra, intentar actualizar por formId
    if (!updatedForm) {
      updatedForm = await Formulario.findOneAndUpdate(
        { formId: id },
        { formDefinition },
        { new: true, runValidators: true }
      );
    }

    if (!updatedForm) {
      return res.status(404).json({ message: "Formulario no encontrado." });
    }

    res.status(200).json(updatedForm);

  } catch (error) {
    console.error("Error al actualizar el formulario:", error);
    res.status(500).json({ message: "Error al actualizar el formulario.", error: error.message });
  }
});

/**
 * @swagger
 * /forms/{id}:
 *   delete:
 *     summary: Eliminar un formulario por ID
 *     tags: [Formularios]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID del formulario a eliminar
 *     responses:
 *       200:
 *         description: Formulario eliminado exitosamente
 *       404:
 *         description: Formulario no encontrado
 *       500:
 *         description: Error del servidor
 */
app.delete('/forms/:id', async (req, res) => {
  const id = req.params.id;

  try {
    // Intentar eliminar primero por el _id de MongoDB
    let deletedForm = await Formulario.findByIdAndDelete(id).catch(() => null);
    
    // Si no se encuentra, intentar eliminar por formId
    if (!deletedForm) {
      deletedForm = await Formulario.findOneAndDelete({ formId: id });
    }

    if (!deletedForm) {
      return res.status(404).json({ message: "Formulario no encontrado." });
    }

    res.status(200).json({ message: "Formulario eliminado correctamente." });

  } catch (error) {
    console.error("Error al eliminar el formulario:", error);
    res.status(500).json({ message: "Error al eliminar el formulario.", error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor API escuchando en el puerto ${port}`);
  console.log(`Documentación Swagger disponible en http://localhost:${port}/api-docs`);
});