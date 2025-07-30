import '../Admin.css'

function AdminCustomInput({ id, label = null, value, setValue, disabled, width = '100%', disableInput, children }) {
    function onChange(val) {
        setValue(val);
    }

    return (
        <div className='custom-input'>
            {
                label &&
                <label htmlFor={id}>{label}</label>
            }

            <div className='input-wrapper'>
                <input
                    type="text"
                    value={value}
                    id={id}
                    disabled={disabled}
                    onChange={(e) => onChange(e.target.value)}
                    onBlur={disableInput}
                    style={{ width: width }}
                />

                {
                    children
                }
            </div>
        </div>
    )
}

export default AdminCustomInput;
