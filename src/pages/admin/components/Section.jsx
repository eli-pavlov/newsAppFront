import '../Admin.css'

function Section({ children, title }) {
    return (
        <div className="section">
            <div>{title}</div>
            {children}
        </div>
    )
}

export default Section;
