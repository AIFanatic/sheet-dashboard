import React from 'react';

import '../styles/luckysheet.css'

class Luckysheet extends React.Component {
    state = { editMode: this.props.editMode };


    getColumnsWidth(luckysheet) {
        const screenWidth = window.innerWidth;
        const numOfColumns = luckysheet.getSheetData()[0].length; // TODO: Should check if entry is available
        const columnWidth = Math.floor(screenWidth / numOfColumns);

        let columnsWidth = {};

        for(let i = 0; i < numOfColumns; i++) {
            columnsWidth[i] = columnWidth;
        }

        return columnsWidth;
    }

    resizeColumnsToScreenWidth(luckysheet) {
        const columnsWidth = this.getColumnsWidth(luckysheet);
        luckysheet.setColumnWidth(columnsWidth);

        const scrollbar = document.getElementsByClassName("luckysheet-scrollbar-x");
        scrollbar[0].children[0].style.width = window.innerWidth.toString() + "px";

    }

    buildLuckysheet() {
        console.log(this.props)
        let options = {};

        const data = this.props.data;

        const rows = data[0].visibledatarow.length;
        const columns = data[0].visibledatacolumn.length;

        if (this.props.editMode) {
            options = {
                data: this.props.data,
                container: 'luckysheet',
                enableAddRow: false,
                enableAddBackTop: false,
                // showtoolbar: false,
                showinfobar: false,
                // sheetFormulaBar: false,
                showstatisticBar: false,
                showsheetbarConfig:{
                    // add: false,
                    menu: false,
                },
                row: rows,
                column: columns,
            }
        }
        else {
            //Configuration item
            options = {
                data: data,
                container: 'luckysheet',
                enableAddRow: false,
                enableAddBackTop: false,
                showtoolbar: false,
                showinfobar: false,
                sheetFormulaBar: false,
                showstatisticBar: false,
                allowCopy: false,
                showsheetbarConfig:{
                    // add: false,
                    menu: false,
                },
                row: rows,
                column: columns,
                columnHeaderHeight: 0,
                rowHeaderWidth: 0
             }
        }

        options.hook = {
            workbookCreateAfter: (json) => {
                this.resizeColumnsToScreenWidth(luckysheet);

                if (!this.props.editMode) {
                    luckysheet.hideGridLines();
                }
                else {
                    luckysheet.showGridLines();
                }
            },
            updated: () => {
                console.log("updated")
                this.props.saveData(luckysheet.getAllSheets());
            },
        }

        const luckysheet = window.luckysheet;
        luckysheet.create(options);

        // window.luckysheet_function.JSON = luckysheet_json_function(luckysheet);
    }

    componentDidUpdate() {
        console.log("componentDidUpdate")

        this.buildLuckysheet();
    }

    componentDidMount() {
        this.buildLuckysheet();
    }

    render() {
        console.log("rendering")
        const luckyCss = {
            margin: '0px',
            padding: '0px',
            position: 'absolute',
            width: '100%',
            bottom: '0px',
            left: '0px',
            top: '0px',
        }

        const modeClassname = this.props.editMode ? "editMode" : "liveMode";

        return (
            <div
            id="luckysheet"
            className={modeClassname}
            style={luckyCss}
            ></div>
        )
    }
}

export default Luckysheet