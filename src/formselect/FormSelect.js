import { Formio } from 'formiojs';           
const Field = Formio.Components.components.field;  
import selectEditForm from './FormSelect.form.js'; 

/*
 * Clase FormSelect - Un componente personalizado para FormIO que permite seleccionar y cargar formularios dinámicamente
 */
export default class FormSelect extends Field {
  static editForm = selectEditForm;  // Asigna el formulario de edición para configurar este componente
  
  static schema(...extend) {
    return Field.schema({
      type: 'formselect',                     // Tipo único para identificar este componente
      label: 'Form Select',                   // Etiqueta que se mostrará junto al componente
      key: 'formselect',                      // Clave para acceder al valor del componente
      placeholder: 'Select a form',           // Texto mostrado cuando no hay selección
      dataUrl: 'http://localhost:3000/forms', // URL para obtener la lista de formularios disponibles
      valueProperty: 'formId',                // Propiedad que se usará como valor del select
      searchField: 'formId',                  // Campo que se usará para búsquedas
      formContainer: 'formio',                // ID del contenedor HTML donde se cargarán los formularios
      selectedFormId: '',                     // ID del formulario seleccionado para guardar la referencia
      storeReference: true                    // Indica si se debe almacenar la referencia al formulario seleccionado
    });
  }

  /**
   * Información para el constructor de formularios de FormIO
   * Define cómo aparecerá este componente en la interfaz de construcción
   */
  static get builderInfo() {
    return {
      title: 'Form Select',                 
      icon: 'list',                         
      group: 'basic',                       
      weight: 0,                            
      schema: FormSelect.schema()           
    };
  }

  constructor(component, options, data) {
    super(component, options, data);
    this.forms = [];                          // Array para almacenar los formularios disponibles
    this.formInstance = null;                 // Instancia del formulario seleccionado
    this.originalElement = null;              // Referencia al elemento original para restaurarlo si es necesario
    this.selectedFormDefinition = null;       // Almacena la definición del formulario seleccionado
  }
  
  /**
   * Inicializa el componente
   * Carga la lista de formularios al iniciar
   */
  init() {
    super.init();                            
    // Establecer selectedFormId desde el valor del componente si existe
    if (this.dataValue && !this.component.selectedFormId) {
      this.component.selectedFormId = this.dataValue;
    }
    
    this.loadForms();                        
  }
  
  /**
   * Método para cargar los formularios desde el servidor
   * Hace una petición a la URL configurada y almacena los resultados
   */
  loadForms() {
    fetch(this.component.dataUrl)
      .then(response => response.json())      // Convierte la respuesta a JSON
      .then(data => {
        this.forms = data;                    // Almacena los formularios
        if (this.refs.select) {               // Si el elemento select ya está en el DOM
          this.populateOptions();             // Rellena las opciones del select
          
          // Si hay un formulario preseleccionado, cárgalo automáticamente
          if (this.component.selectedFormId) {
            this.refs.select.value = this.component.selectedFormId;
            this.loadSelectedForm(this.component.selectedFormId);
          }
        }
      })
      .catch(error => {
        console.error('Error loading forms:', error);  // Muestra errores en consola
      });
  }
  
  /**
   * Configura la información del elemento input
   * Sobrescribe el método de la clase padre para personalizar el input
   */
  get inputInfo() {
    const info = super.inputInfo;
    info.type = 'select';                     // Cambia el tipo a select
    info.attr.class = 'form-control';         // Asigna clase CSS de Bootstrap
    info.attr.id = `${this.key}`;             // Asigna un ID único
    return info;
  }
  
  /**
   * Renderiza el elemento select en el DOM
   */
  render(content) {
    return super.render(`
      <div ref="element">
        <select ref="select" class="form-control" id="${this.key}">
          <option value="">${this.component.placeholder}</option>
        </select>
        <div ref="formContainer"></div>
        <button ref="resetButton" class="btn btn-secondary btn-sm mt-2" style="display: none;">Volver al selector</button>
      </div>
    `);
  }
  
  /**
   * Rellena las opciones del select con los formularios disponibles
   */
  populateOptions() {
    if (!this.refs.select) return;             // Verifica que el select exista
    
    // Limpia las opciones existentes excepto el placeholder
    while (this.refs.select.options.length > 1) {
      this.refs.select.remove(1);
    }
    
    // Agrega las nuevas opciones desde los datos de formularios
    this.forms.forEach(form => {
      const option = document.createElement('option');
      option.value = form[this.component.valueProperty];       // Usa la propiedad configurada como valor
      option.textContent = form[this.component.valueProperty]; // Usa la misma propiedad como texto
      this.refs.select.appendChild(option);
    });
  
    // Si hay un valor seleccionado previamente, lo establece
    if (this.dataValue) {
      this.refs.select.value = this.dataValue;
    }
  }
  
  /**
   * Carga el formulario seleccionado reemplazando el selector
   */
  loadSelectedForm(formId) {
    // Encuentra el formulario seleccionado en el array de formularios
    const selectedForm = this.forms.find(form => form[this.component.valueProperty] === formId);
    
    if (!selectedForm) {
      console.error('Form not found with ID:', formId);
      return;
    }
    
    const formDefinition = selectedForm.formDefinition;
    
    if (!formDefinition) {
      console.error('Form definition not found for form with ID:', formId);
      return;
    }
    
    // Guarda la definición del formulario seleccionado
    this.selectedFormDefinition = formDefinition;
    
    // Actualiza el selectedFormId en el componente
    this.component.selectedFormId = formId;
    
    // Guarda el elemento original (todo el contenedor del componente)
    this.originalElement = this.element.cloneNode(true);
    
    // Oculta el selector
    if (this.refs.select) {
      this.refs.select.style.display = 'none';
    }
    
    // Muestra el botón de reset
    if (this.refs.resetButton) {
      this.refs.resetButton.style.display = 'block';
    }
    
    // Limpia el contenedor de formulario por si hubiera algo
    if (this.refs.formContainer) {
      this.refs.formContainer.innerHTML = '';
      
      // Crea una nueva instancia del formulario seleccionado usando FormIO
      Formio.createForm(this.refs.formContainer, formDefinition, {
        sanitizeConfig: {
          addTags: ["svg", "path"],            // Permite tags SVG
          addAttr: ["d", "viewBox"]            // Permite atributos SVG
        }
      }).then(form => {
        // Guarda la instancia del formulario
        this.formInstance = form;
        console.log('Form loaded successfully', form);
        
        // Emite un evento de carga de formulario que otros componentes pueden escuchar
        this.emit('formLoad', {
          form,
          formId,
          formDefinition
        });
      }).catch(error => {
        console.error('Error loading form:', error);
      });
    }
  }
  
  /**
   * Restaura el selector de formularios
   */
  resetFormSelect() {
    // Si hay una instancia de formulario activa, la destruye
    if (this.formInstance) {
      this.formInstance.destroy();
      this.formInstance = null;
    }
    
    // Limpia el contenedor de formulario
    if (this.refs.formContainer) {
      this.refs.formContainer.innerHTML = '';
    }
    
    // Muestra de nuevo el selector
    if (this.refs.select) {
      this.refs.select.style.display = 'block';
      this.refs.select.value = ''; // Resetea la selección
    }
    
    // Oculta el botón de reset
    if (this.refs.resetButton) {
      this.refs.resetButton.style.display = 'none';
    }
    
    // Actualiza el valor del componente y resetea la referencia almacenada
    this.updateValue('');
    this.component.selectedFormId = '';
    this.selectedFormDefinition = null;
  }
  
  /**
   * Adjunta los eventos y referencias al elemento DOM
   */
  attach(element) {
    const result = super.attach(element);
    this.loadRefs(element, {
      select: 'single',
      formContainer: 'single',
      resetButton: 'single'
    });
  
    if (this.refs.select) {
      this.addEventListener(this.refs.select, 'change', () => {
        const value = this.refs.select.value;
        this.updateValue(value);              
  
        if (value) {
          this.loadSelectedForm(value);       
        }
      });
      
      this.populateOptions();                 
    }
    
    if (this.refs.resetButton) {
      this.addEventListener(this.refs.resetButton, 'click', () => {
        this.resetFormSelect();
      });
    }
  
    return result;
  }

  getValue() {
    return super.getValue();
  }

  setValue(value, flags = {}) {
    if (this.refs.select) {
      this.refs.select.value = value || '';  
      
      if (value && !flags.noLoad) {
        this.loadSelectedForm(value);        
      }
    }
    return super.setValue(value, flags);
  }
  
  /**
   * Obtiene la información completa para ser almacenada
   * Incluye la referencia y opcionalmente la definición del formulario
   */
  getFormReference() {
    if (!this.component.selectedFormId) {
      return null;
    }
    
    return {
      formId: this.component.selectedFormId,
      formDefinition: this.component.storeReference ? this.selectedFormDefinition : null
    };
  }
  
  /**
   * Limpia los recursos cuando el componente es destruido
   */
  destroy() {
    if (this.formInstance) {
      this.formInstance.destroy();
    }
    super.destroy();
  }
}