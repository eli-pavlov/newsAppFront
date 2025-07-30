import './Modal.css'

export function ModalTitle( { titleData }) {
    return (
        <div className='title' style={ titleData?.style }>
            {titleData?.text}
        </div>
    )
}

export function ModalSubTitle( { subtitleData } ) {
    return (
        <div className='subtitle' style={ subtitleData?.style }>
            {subtitleData?.text}
        </div>
    )
}

export function Modal( { children, closeCallback } ) {
    function closeModal() {
        closeCallback();
    }

    return (
        <div className="modal" /*style={{height:document.documentElement.scrollHeight, top:window.scrollY}}*/ >
            <div className='content'>
                <div className='close'>
                    <i className="fa fa-close" onClick={ closeModal }></i>
                </div>

                {children}
            </div>
        </div>
    )
}

Modal.Title = ModalTitle;
Modal.SubTitle = ModalSubTitle;

export default Modal;
