import './Loader.css'

function Loader({ fullScreen=false, transparent=true}) {
    return (
        <div className={`loader-wrapper ${transparent ? "transparent" : ''} ${fullScreen ? 'full-screen' : ''}`}>
            <div className="wait-loader"></div>
        </div>
    )
}

export default Loader;
