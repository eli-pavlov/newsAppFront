import './CustomButton.css'

export function CustomButton( { btnData } ) {
    return (
        <div className={
            `
                custom-button-wrapper 
                ${btnData.noHover ? 'no-hover' : null}
            `}>
            <button 
                name = { btnData.name }
                type= { btnData.type || "submit" }
                className={`${btnData.disabled ? 'disabled' : null}`}
                style = { btnData.style || null }
                value = { btnData.value || null }
                onClick = { btnData.onClick || null }
            >
                {btnData.text}
            </button>

            {
                btnData.errMsg &&
                <div className='error-msg'>{btnData.errMsg}</div>
            }
        </div>
    )
}

export function CustomIconButton( { btnData } ) {
    return (
        <div className={`custom-button-wrapper icon`}>
            <i 
                name = { btnData.name }
                className={btnData.icon} 
                style = { btnData.style || null }
                value = { btnData.value || null }
                onClick = { btnData.onClick || null }
            >
            </i>
        </div>
    )
}
