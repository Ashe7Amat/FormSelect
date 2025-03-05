import { Formio } from 'formiojs'; // Importa la librería principal Formio desde 'formiojs'
import FormSelect from './formselect/FormSelect.js'; // Importa el componente personalizado FormSelect desde el archivo FormSelect.js

// Registro de los componentes personalizados
Formio.use([ // Usa la función 'use' de Formio para registrar componentes personalizados
  { // Define un objeto de configuración para registrar componentes
    components: { // Define la sección de componentes
      formselect: FormSelect // Registra el componente FormSelect bajo el nombre 'formselect'
    }
  }
]);

// Estructura HTML recomendada (esto es un comentario, no es código Javascript)
// <div id="form-selector"></div>  // Div para el selector de formularios
// <div id="formio"></div>         // Div donde se mostrará el formulario seleccionado
// <div id="builder"></div>        // Div para el constructor de formularios (drag and drop)
// <div id="builder-controls"></div> // Div para los controles del constructor (botones, etc.)

// Creamos el selector de formularios
Formio.createForm(document.getElementById('form-selector'), { // Crea un formulario Formio dentro del div con ID 'form-selector'
  components: [ // Define los componentes que tendrá este formulario (en este caso, solo uno)
    { // Define un componente
      type: "formselect", // Tipo de componente: nuestro componente personalizado 'formselect'
      label: "Selecciona un formulario", // Etiqueta que se mostrará al usuario para este componente
      key: "formSelect", // Nombre interno del componente (para acceder a su valor, etc.)
      placeholder: "Selecciona un formulario", // Texto de ejemplo que se muestra cuando no se ha seleccionado nada
      dataUrl: "http://localhost:3000/forms", // URL del backend donde se obtendrá la lista de formularios para el selector
      valueProperty: "formId", // Propiedad del objeto formulario que se usará como valor seleccionado
      searchField: "formId", // Campo por el que se buscará en la lista de formularios (para autocompletar, etc.)
      formContainer: "formio" // ID del div donde se cargará el formulario seleccionado
    }
  ]
}, { // Opciones de configuración para la creación del formulario selector
  sanitizeConfig: { // Configuración para "limpiar" el HTML dentro de los formularios por seguridad
    addTags: ["svg", "path"], // Permite las etiquetas HTML 'svg' y 'path'
    addAttr: ["d", "viewBox"] // Permite los atributos 'd' y 'viewBox' en las etiquetas permitidas (para SVG)
  }
}).then(form => { // Después de que se cree el selector de formularios, se ejecuta esta función (promesa)
  console.log('Form selector ready', form); // Muestra un mensaje en la consola indicando que el selector está listo
});

// Variable para almacenar la instancia del constructor de formularios
let formBuilder = null; // Inicializa una variable para guardar la instancia del constructor, inicialmente vacía

// Para el constructor de formularios
Formio.builder(document.getElementById("builder"), {}, { // Crea el constructor de formularios en el div con ID 'builder'
  sanitizeConfig: { // Configuración de limpieza de HTML (igual que en el selector de formularios)
    addTags: ["svg", "path"],
    addAttr: ["d", "viewBox"]
  }
}).then((builder) => { // Después de que se cree el constructor, se ejecuta esta función (promesa)
  formBuilder = builder; // Guarda la instancia del constructor en la variable 'formBuilder'
  console.log('Builder ready'); // Muestra un mensaje en la consola indicando que el constructor está listo

  // Crear controles del constructor
  createBuilderControls(); // Llama a la función para crear los botones de control del constructor (Guardar, etc.)
});

// Función para crear los controles del constructor de formularios
function createBuilderControls() {
  const controlsContainer = document.getElementById('builder-controls'); // Intenta obtener el div de controles por su ID
  if (!controlsContainer) { // Si no existe el div de controles (no se encontró en el HTML)
    // Si no existe el contenedor, lo creamos
    const newControlsContainer = document.createElement('div'); // Crea un nuevo elemento div
    newControlsContainer.id = 'builder-controls'; // Le asigna el ID 'builder-controls'
    newControlsContainer.className = 'mt-3'; // Le asigna la clase CSS 'mt-3' (margin-top: 3) para espaciado

    // Insertamos el contenedor después del builder
    const builderElement = document.getElementById('builder'); // Obtiene el elemento del constructor
    if (builderElement && builderElement.parentNode) { // Si el elemento del constructor existe y tiene un padre
      builderElement.parentNode.insertBefore(newControlsContainer, builderElement.nextSibling); // Inserta el nuevo contenedor después del constructor
    } else { // Si no se encuentra el constructor o no tiene padre (algo raro)
      document.body.appendChild(newControlsContainer); // Añade el contenedor directamente al body (último elemento)
    }

    controlsContainer = newControlsContainer; // Asigna el nuevo contenedor a la variable 'controlsContainer'
  }

  // Crear el botón de guardar
  const saveButton = document.createElement('button'); // Crea un nuevo elemento botón
  saveButton.textContent = 'Guardar Formulario'; // Establece el texto del botón
  saveButton.className = 'btn btn-primary mr-2'; // Le asigna clases CSS para estilo (Bootstrap: botón primario y margen derecho)
  saveButton.onclick = saveFormDefinition; // Define la función que se ejecutará al hacer clic en el botón ('saveFormDefinition')

  // Agregar el botón al contenedor
  controlsContainer.appendChild(saveButton); // Añade el botón como hijo del contenedor de controles

  // Agregar un div para mostrar mensajes
  const messageDiv = document.createElement('div'); // Crea un nuevo div para mostrar mensajes
  messageDiv.id = 'save-message'; // Le asigna el ID 'save-message'
  messageDiv.className = 'mt-2'; // Le asigna la clase CSS 'mt-2' (margin-top: 2) para espaciado
  controlsContainer.appendChild(messageDiv); // Añade el div de mensajes al contenedor de controles
}

// Función para guardar la definición del formulario
function saveFormDefinition() {
  if (!formBuilder) { // Comprueba si el constructor de formularios está inicializado
    showMessage('Error: El constructor de formularios no está inicializado', 'danger'); // Si no, muestra un mensaje de error
    return; // Sale de la función
  }

  // Obtener la definición del formulario
  const formDefinition = formBuilder.schema; // Obtiene el esquema del formulario del constructor (la definición JSON)

  // Verificar si el formulario tiene un título
  if (!formDefinition.title) { // Si la definición del formulario no tiene un título
    const formTitle = prompt('Por favor, introduce un título para el formulario:'); // Pide al usuario que introduzca un título usando un 'prompt'
    if (!formTitle) { // Si el usuario cancela o no introduce un título
      showMessage('Error: Se requiere un título para guardar el formulario', 'danger'); // Muestra un mensaje de error
      return; // Sale de la función
    }
    formDefinition.title = formTitle; // Asigna el título introducido por el usuario a la definición del formulario
    formDefinition.formId = formTitle; // Asigna también el título como 'formId' (identificador del formulario)
  }

  // Pone formId si el title existe pero el formId no
  if (!formDefinition.formId && formDefinition.title) { // Si no hay 'formId' pero sí 'title'
    formDefinition.formId = formDefinition.title; // Asigna el título como 'formId'
  }

  // Procesar los componentes y recopilar referencias a formularios
  processFormComponents(formDefinition.components); // Llama a la función para procesar los componentes (para manejar 'formselect' y referencias)

  // Preparar los datos para enviar
  const formData = { // Crea un objeto con los datos del formulario para enviar al backend
    formId: formDefinition.formId, // Incluye el 'formId'
    title: formDefinition.title, // Incluye el título
    formDefinition: formDefinition // Incluye la definición completa del formulario (el esquema)
  };

  // Enviar los datos al servidor
  fetch('http://localhost:3000/forms', { // Realiza una petición HTTP POST a la URL del backend
    method: 'POST', // Método HTTP POST (para crear un nuevo recurso en el servidor)
    headers: { // Cabeceras de la petición
      'Content-Type': 'application/json' // Indica que el cuerpo de la petición es JSON
    },
    body: JSON.stringify(formData) // Convierte el objeto 'formData' a JSON y lo pone como cuerpo de la petición
  })
  .then(response => { // Después de que el servidor responda, se ejecuta esta función (promesa)
    if (!response.ok) { // Comprueba si la respuesta del servidor es exitosa (código de estado 2xx)
      throw new Error(`Error al guardar: ${response.status} ${response.statusText}`); // Si no es exitosa, lanza un error
    }
    return response.json(); // Si es exitosa, convierte la respuesta del servidor a JSON
  })
  .then(data => { // Después de convertir la respuesta a JSON, se ejecuta esta función (promesa)
    showMessage(`Formulario "${formDefinition.title}" guardado correctamente`, 'success'); // Muestra un mensaje de éxito
    console.log('Formulario guardado:', data); // Muestra en la consola los datos de la respuesta del servidor

    // Si hay un selector de formularios, actualizarlo
    const formSelect = document.querySelector('[data-type="formselect"]'); // Busca el elemento del selector de formularios en el DOM
    if (formSelect && formSelect.component && typeof formSelect.component.loadForms === 'function') { // Si se encuentra el selector y tiene la función 'loadForms'
      formSelect.component.loadForms(); // Llama a la función 'loadForms' para actualizar la lista de formularios en el selector
    }
  })
  .catch(error => { // Si ocurre algún error en la petición al servidor (red, servidor no responde, etc.)
    showMessage(`Error al guardar el formulario: ${error.message}`, 'danger'); // Muestra un mensaje de error
    console.error('Error saving form:', error); // Muestra el error en la consola
  });
}

// Función para procesar los componentes y recopilar referencias a formularios
function processFormComponents(components) {
  if (!components || !Array.isArray(components)) { // Comprueba si 'components' es un array válido (o no es nada)
    return; // Si no es un array válido, sale de la función (no hay componentes que procesar)
  }

  components.forEach(component => { // Itera sobre cada componente del array 'components'
    // Si es un componente de selección de formulario, procesa sus referencias
    if (component.type === 'formselect') { // Comprueba si el tipo del componente es 'formselect' (nuestro componente personalizado)
      // Obtener la instancia del componente
      const formSelectElement = document.querySelector(`[name="${component.key}"]`); // Busca el elemento DOM del componente 'formselect' por su nombre (atributo 'name')
      if (formSelectElement && formSelectElement.component) { // Si se encuentra el elemento y tiene una instancia de componente Formio asociada
        // Si el componente tiene una referencia almacenada
        if (formSelectElement.component.component.selectedFormId) { // Comprueba si el componente 'formselect' tiene un 'selectedFormId' (formulario seleccionado)
          // Guarda la referencia en el componente
          component.selectedFormId = formSelectElement.component.component.selectedFormId; // Guarda el 'selectedFormId' en la definición del componente actual (que se está guardando)

          // Si se debe almacenar la definición completa y hay una referencia disponible
          if (component.storeReference && formSelectElement.component.selectedFormDefinition) { // Comprueba si se debe guardar la definición completa y si está disponible
            component.referencedFormDefinition = formSelectElement.component.selectedFormDefinition; // Guarda la definición completa del formulario referenciado
          }
        }
      }
    }

    // Procesar componentes anidados (contenedores, pestañas, etc.) - RECURSIVIDAD
    if (component.components) { // Si el componente tiene componentes anidados dentro de él
      processFormComponents(component.components); // Llama a la función 'processFormComponents' de nuevo, pero con los componentes anidados (recursividad)
    }

    // Procesar filas y columnas - RECURSIVIDAD
    if (component.rows) { // Si el componente tiene filas (para layouts de columnas)
      component.rows.forEach(row => { // Itera sobre cada fila
        row.forEach(col => { // Itera sobre cada columna dentro de la fila
          if (col.components) { // Si la columna tiene componentes
            processFormComponents(col.components); // Llama a 'processFormComponents' recursivamente para procesar los componentes de la columna
          }
        });
      });
    }

    // Procesar pestañas - RECURSIVIDAD
    if (component.tabs) { // Si el componente tiene pestañas
      component.tabs.forEach(tab => { // Itera sobre cada pestaña
        if (tab.components) { // Si la pestaña tiene componentes
          processFormComponents(tab.components); // Llama a 'processFormComponents' recursivamente para procesar los componentes de la pestaña
        }
      });
    }
  });
}

// Función para mostrar mensajes
function showMessage(message, type = 'info') {
  const messageDiv = document.getElementById('save-message'); // Obtiene el div para mensajes por su ID
  if (messageDiv) { // Si se encontró el div de mensajes
    // Definir clases según el tipo de mensaje
    const classes = { // Define un objeto con clases CSS para diferentes tipos de mensajes
      success: 'alert alert-success', // Clase para mensajes de éxito (Bootstrap)
      danger: 'alert alert-danger', // Clase para mensajes de error (Bootstrap)
      warning: 'alert alert-warning', // Clase para mensajes de advertencia (Bootstrap)
      info: 'alert alert-info' // Clase para mensajes informativos (Bootstrap)
    };

    messageDiv.className = classes[type] || classes.info; // Asigna la clase CSS al div de mensajes según el tipo, o 'info' por defecto
    messageDiv.textContent = message; // Establece el texto del mensaje

    // Ocultar el mensaje después de 5 segundos
    setTimeout(() => { // Usa 'setTimeout' para ejecutar una función después de 5000 milisegundos (5 segundos)
      messageDiv.textContent = ''; // Borra el texto del mensaje (lo deja vacío)
      messageDiv.className = ''; // Borra las clases CSS (vuelve al estilo por defecto o sin estilo)
    }, 5000); // Tiempo en milisegundos (5 segundos)
  }
}

// Función para cargar un formulario seleccionado
function loadForm(formId) {
  fetch(`http://localhost:3000/forms/${formId}`) // Realiza una petición HTTP GET al backend para obtener la definición del formulario por su ID
    .then(response => { // Después de que el servidor responda, se ejecuta esta función (promesa)
      if (!response.ok) { // Comprueba si la respuesta es exitosa
        throw new Error(`Error al cargar el formulario: ${response.status} ${response.statusText}`); // Si no, lanza un error
      }
      return response.json(); // Si es exitosa, convierte la respuesta a JSON
    })
    .then(formData => { // Después de convertir la respuesta a JSON, se ejecuta esta función (promesa)
      if (!formData.formDefinition) { // Comprueba si la respuesta JSON contiene la definición del formulario ('formDefinition')
        showMessage('Error: Definición de formulario no encontrada', 'danger'); // Si no la encuentra, muestra un mensaje de error
        return; // Sale de la función
      }

      // Procesar componentes para establecer las referencias almacenadas
      prepareFormComponentsForRender(formData.formDefinition.components); // Llama a la función para preparar los componentes para renderizar (restaurar referencias, etc.)

      // Cargar el formulario en el contenedor de visualización
      const formContainer = document.getElementById('formio'); // Obtiene el div de contenedor del formulario por su ID
      if (formContainer) { // Si se encontró el contenedor
        formContainer.innerHTML = ''; // Limpia el contenido del contenedor (borra cualquier formulario anterior)

        Formio.createForm(formContainer, formData.formDefinition, { // Crea un nuevo formulario Formio dentro del contenedor
          sanitizeConfig: { // Configuración de limpieza de HTML (igual que antes)
            addTags: ["svg", "path"],
            addAttr: ["d", "viewBox"]
          }
        }).then(form => { // Después de que se cree el formulario, se ejecuta esta función (promesa)
          console.log('Form loaded successfully:', formData.title); // Muestra un mensaje de éxito en la consola
        }).catch(error => { // Si ocurre algún error al crear el formulario
          showMessage(`Error al cargar el formulario: ${error.message}`, 'danger'); // Muestra un mensaje de error
          console.error('Error loading form:', error); // Muestra el error en la consola
        });
      }
    })
    .catch(error => { // Si ocurre algún error en la petición al servidor (al obtener la definición)
      showMessage(`Error al cargar el formulario: ${error.message}`, 'danger'); // Muestra un mensaje de error
      console.error('Error loading form:', error); // Muestra el error en la consola
    });
}

// Función para preparar los componentes para su renderizado
function prepareFormComponentsForRender(components) {
  if (!components || !Array.isArray(components)) { // Comprueba si 'components' es un array válido
    return; // Si no lo es, sale de la función
  }

  components.forEach(component => { // Itera sobre cada componente
    // Si es un componente formselect y tiene una referencia almacenada
    if (component.type === 'formselect' && component.selectedFormId) { // Comprueba si es un 'formselect' y tiene un 'selectedFormId'
      // Aseguramos que el valor del componente es el ID del formulario seleccionado
      component.defaultValue = component.selectedFormId; // Establece el 'defaultValue' del componente 'formselect' al 'selectedFormId'. Esto hará que aparezca seleccionado por defecto.
    }

    // Procesar componentes anidados - RECURSIVIDAD
    if (component.components) { // Si tiene componentes anidados
      prepareFormComponentsForRender(component.components); // Llama a la función recursivamente
    }

    // Procesar filas y columnas - RECURSIVIDAD
    if (component.rows) { // Si tiene filas
      component.rows.forEach(row => { // Itera sobre las filas
        row.forEach(col => { // Itera sobre las columnas en cada fila
          if (col.components) { // Si la columna tiene componentes
            prepareFormComponentsForRender(col.components); // Llama a la función recursivamente para la columna
          }
        });
      });
    }

    // Procesar pestañas - RECURSIVIDAD
    if (component.tabs) { // Si tiene pestañas
      component.tabs.forEach(tab => { // Itera sobre las pestañas
        if (tab.components) { // Si la pestaña tiene componentes
          prepareFormComponentsForRender(tab.components); // Llama a la función recursivamente para la pestaña
        }
      });
    }
  });
}