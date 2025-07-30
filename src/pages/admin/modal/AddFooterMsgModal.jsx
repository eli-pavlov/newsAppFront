import CustomInput from '../../../components/CustomInput'
import { CustomButton } from "../../../components/CustomButton";
import Modal from '../../../components/Modal'
import { useState } from 'react';

function AddFooterMsgModal( {closeHandler, saveHandler } ) {
    const [newMsg, setNewMsg] = useState('');

    function saveData(event) {
        event.preventDefault();

        saveHandler(newMsg);
    }

    return (
        <Modal 
            closeCallback={closeHandler} 
        >
            <Modal.Title 
                titleData= {{ text:"New Message" }} 
            />

            <form onSubmit={ saveData }>
                <CustomInput 
                    inputData= {
                        {
                            name: "message",
                            title: "Message",
                            value: newMsg,
                            required: true,
                            updateCallback: {func:setNewMsg}
                        }
                    }                
                />

                <CustomButton 
                    btnData = {
                        {
                            name: "save" ,
                            text: "Add Message", 
                            style: {"fontSize":"24px"},
                            type: "submit"
                        }
                    }
                />
            </form>
        </Modal>
    )
}

export default AddFooterMsgModal;
