import { useState, useEffect } from 'react';
import './CustomInput.css'

function CustomInput( { inputData } ) {
    const [value, setValue] = useState(inputData.value);

    // display the label and the input in one row
    const oneRowClass = inputData.onerow ? 'one-row' : '';

    const iconClass = inputData.icon ? 'with-icon' : ''

    useEffect(() => {
        setValue(inputData.value);
    }, [inputData.value]);

    function onChange(event) {
        setValue(event.target.value);

        const { updateCallback } = inputData;

        if ('params' in updateCallback)
            updateCallback.func(updateCallback.params, event.target.value);
        else
            updateCallback.func(event.target.value);
    }

    return (
        <div className={`custom-input-wrapper ${oneRowClass} ${iconClass}`}>
            {
                inputData.title &&
                <label 
                    htmlFor={inputData.name} 
                    className={`${oneRowClass}`}
                    style = { inputData.labelStyle || null }
                >
                    {inputData.title}
                </label>
            }
            
            <input 
                className={`${iconClass}`}
                name = { inputData.name }
                placeholder = { inputData.placeholder || null }
                type = { inputData.type || "text" }
                value = { value }
                minLength = { inputData.minlength || null }
                maxLength = { inputData.maxlength || null }
                min = { inputData.min }
                pattern = { inputData.pattern || null }
                style = { inputData.style || null }

                required = {inputData.required}

                onChange = { onChange }
            />
            {
                inputData.icon &&
                <i className={`fa fa-${inputData.icon}`}></i>
            }        
            {
                inputData.instruction &&
                <div style={ inputData.instructionStyle || null }>{ inputData.instruction }</div>
            }        
        </div>
    )
}

export default CustomInput
