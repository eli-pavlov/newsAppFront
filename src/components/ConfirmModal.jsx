import Modal from "./Modal"
import { CustomButton } from "./CustomButton"

function ConfirmModal({ titleData, subtitleData, yesData, noData, closeHandler }) {
    function onClick(event) {
        switch (event.target.value) {
            case "yes":
                yesData.actionHandler();
                break;

            case "no":
                break;
        }
        closeHandler();
    }

    return (
        <Modal
            closeCallback={closeHandler} 
        >
            <Modal.Title titleData={ titleData } />
            <Modal.SubTitle subtitleData={ subtitleData } />

            <CustomButton 
                btnData = {
                    {
                        name: "yes" ,
                        text: yesData.text ,
                        type: "button",
                        onClick: onClick,
                        value: "yes",
                        style: yesData.style,
                        noHover: yesData.noHover
                    }
                }
            />

            <CustomButton 
                btnData = {
                    {
                        name: "no",
                        text: noData.text, 
                        type: "button",
                        onClick: onClick,
                        value: "no",
                        style: noData.style,
                        noHover: noData.noHover
                    }
                }
            />
        </Modal>
    )
}

export default ConfirmModal;
