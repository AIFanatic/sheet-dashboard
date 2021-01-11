import React, { useState } from 'react';
import './App.css';
import Luckysheet from './component/Luckysheet'
import { ActionMenu } from './component/ActionMenu';

const defaultWorkbook = [{ "name": "Sheet1", color: "", "status": "1", "order": "0", "data": [], "config": {}, "index":0, "visibledatarow": [[],[],[]], "visibledatacolumn": [[],[],[]] }];

function App() {
    const [data, setData] = useState(getData());
    const [editMode, setEditMode] = useState(false);

    function getData(): any {
        const storedData = localStorage.getItem("luckysheet-data");

        if (storedData) {
            try {
                return JSON.parse(storedData);   
            } catch (error) {
                console.error("Error parsing localStorage data", error);
            }
        }

        return defaultWorkbook;
    }

    function saveData(_data: any, refresh: boolean = false) {
        if (_data == null) {
            _data = defaultWorkbook;
        }

        const dataString = JSON.stringify(_data);
        localStorage.setItem("luckysheet-data", dataString);

        if (refresh) {
            setData(getData()); 
        }
    }

    function setMode(mode: boolean) {
        setData(getData());
        setEditMode(mode);
    }

    return (
        <div className="App">
            <Luckysheet data={data} editMode={editMode} saveData={saveData}/>
            <ActionMenu editMode={editMode} setEditMode={setMode} saveData={saveData} getData={getData}/>
        </div>
    );
}

export default App;
