import { Formio } from "formiojs";
import FormSelectEditDisplay from "./editForm/FormSelect.edit.display.js";

export default function (...extend) {
  return Formio.Components.baseEditForm(
    [
      {
        key: "data",
        components: [
          {
            type: 'textfield',
            key: 'dataUrl',
            label: 'Data URL',
            input: true,
            placeholder: 'http://localhost:3000/forms',
            defaultValue: 'http://localhost:3000/forms'
          },
          {
            type: 'textfield',
            key: 'valueProperty',
            label: 'Value Property',
            input: true,
            placeholder: 'formId',
            defaultValue: 'formId'
          },
          {
            type: 'textfield',
            key: 'searchField',
            label: 'Search Field',
            input: true,
            placeholder: 'formId',
            defaultValue: 'formId'
          },
          {
            type: 'textfield',
            key: 'formContainer',
            label: 'Form Container ID',
            input: true,
            placeholder: 'formio',
            defaultValue: 'formio',
            tooltip: 'The ID of the HTML element where the selected form will be rendered'
          },
          {
            type: 'checkbox',
            key: 'storeReference',
            label: 'Store Form Reference',
            input: true,
            defaultValue: true,
            tooltip: 'Whether to store the full form definition as a reference or just the formId'
          }
        ]
      },
      {
        key: "display",
        components: FormSelectEditDisplay
      },
      {
        key: "validation",
        ignore: false
      }
    ],
    ...extend
  );
}