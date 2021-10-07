import './App.css';
import React, {useEffect, useState} from "react";
import Loader from "./Loader/Loader";
import {CSVLink} from "react-csv";

function App() {
    const [cryptoCurrencies, setCryptoCurrencies] = useState([])
    const [balances, setBalances] = useState([])
    const [loading, setLoading] = useState(true)
    const [timer, setTimer] = useState(0)
    const [csvData, setCsvData] = useState([])

    //получаем данные по валютам
    useEffect(() => {
        fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=true')
            .then(response => response.json())
            .then(data => {
                data.forEach(elem => {
                        let contract = elem.platforms['ethereum']
                        if (contract) {//выбираем только те которые находятся в сети эфира
                            cryptoCurrencies.push({
                                contract: elem.platforms['ethereum'],//получаем контракт, в дальнейшем нужен для чека баланса
                                name: elem.name + ' (' + elem.symbol.toUpperCase() + ')' //названия для селекта
                            })
                        }
                    }
                )
                setCryptoCurrencies(cryptoCurrencies)
                setBalances([{
                    id: 0,
                    name: cryptoCurrencies[0].name,
                    contract: cryptoCurrencies[0].contract,
                    address: '',
                    balance: ''
                }])
                setLoading(false)
            })
    }, [cryptoCurrencies])

    //функция для поиска в селекте
    function searchInput(id) {
        const s = document.getElementById(`select_${id}`) //получаем эоемент
        const opt = s.querySelectorAll('option');
        document.querySelector(`#input_${id}`)
            .addEventListener('input', ({target}) => {
                if (target.value) { //если в инпут что-то ввели начинаем поиск
                    // eslint-disable-next-line array-callback-return
                    [...opt].map(o => {
                        const optLabel = o.label.toLowerCase().trim()
                        const targetVal = target.value.toLowerCase().trim()
                        if (optLabel.includes(targetVal)) { //сравниваем, если содержит то выбираем данный элемент
                            o.selected = true
                            for (let i = 0; i < balances.length; i++) {
                                if (balances[i].id.toString() === id.toString()) { //заносим в кеш выбранную валюту
                                    const contract = o.value
                                    const address = balances[i].address
                                    const balance = balances[i].balance
                                    balances[i] = {id, name: o.label, contract, address, balance}
                                    break
                                }
                            }
                        }
                    })
                }
            }, false)
    }

    //функция при изменении селекта или адресса
    function onChangeHandler(event) {
        const id = event.target.id.split('_')[1]
        for (let i = 0; i < balances.length; i++) {
            if (balances[i].id.toString() === id.toString()) { //чтобы изменить конкретный индекс в кеше
                let name = balances[i].name //название крипты
                let contract = balances[i].contract; //контракт
                let address = balances[i].address //адресс кошелька
                const balance = balances[i].balance //баланс
                if (event.target.localName === 'select') { //если изменяем селект, то нам надо поменять только контракт и название
                    contract = event.target.value.trim()
                    name = event.target.label
                } else { //иначе - меняем адресс
                    address = event.target.value.trim()
                }
                balances[i] = {id, name, contract, address, balance}
                break
            }
        }
    }

    // функция добавления строки
    function onClickAddRow() {
        balances.push({
            id: balances.length,
            name: cryptoCurrencies[0].name,
            contract: cryptoCurrencies[0].contract,
            address: '',
            balance: ''
        })
        setBalances([...balances])
    }

    // фкнуция получения баланса
    function onClickGetBalance() {
        setLoading(true) //запускаем лоадер
        let timer = balances.length
        setTimer(timer) // ставим таймер
        for (let i = 0; i < balances.length; i++) {
            // тут необходимо исмопользовать таймаут, так как ограницения запросов к апи
            // eslint-disable-next-line no-loop-func
            setTimeout(() => {
                // соответсвенно сам запрос к апи
                fetch('https://api.etherscan.io/api?' +
                    'module=account&' +
                    'action=tokenbalance&' +
                    `contractaddress=${balances[i].contract}&` +
                    `address=${balances[i].address}&` +
                    'tag=latest&' +
                    'apikey=TNQ9X77UMCEGC7JUJE72RPYEDEC58T4R8P')
                    .then(response => response.json())
                    .then(data => {
                        // если успешно, то меняем баланс, иначе нет
                        if (data.status === '1') {
                            balances[i].balance = data.result * 10 ** -18
                        } else {
                            balances[i].balance = ''
                        }
                        setTimer(timer--) //уменьшаем таймер
                    })
            }, i * 1000)
        }
        // когда выполнится последний запрос, то мы меняем кеш
        setTimeout(() => {
            setBalances([...balances])
            setLoading(false)
            setTimer(0)
        }, balances.length * 1000)
    }

    return (
        <div className="App">
            <header className="App-header">
                {/*сррбственно сам таймер, показываюший сколько времени будет считаться баланс*/}
                {timer ?
                    <div>
                        {
                            ~~(timer / 60 / 60) + 'h ' + ~~(timer / 60 % 60) + 'm ' + ~~(timer % 60) + 's'
                        }
                    </div>
                    :
                    <></>
                }
                {loading ?
                    <Loader/> //лоадер был взят с сайта https://loading.io/css/
                    :
                    <table>
                        <thead>
                        <tr>
                            <th>Cryptocurrency</th>
                            <th>Address</th>
                            <th>Balance</th>
                        </tr>
                        </thead>
                        <tbody>
                        {
                            // формируем строки
                            balances.map((elem, index) => (
                                <tr key={index}>
                                    <th>
                                        <div
                                            style={
                                                {
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    width: 250
                                                }
                                            }
                                        >
                                            {/*в данном инпуте можно писать название крипты и она будет выбираться в селекте*/}
                                            <input
                                                type="text"
                                                id={`input_${index}`}
                                                onChange={() => searchInput(index)}
                                                placeholder={'Search cryptocurrency'}
                                            />
                                            {/*в седекте представленны криптовалюты*/}
                                            <select
                                                onChange={onChangeHandler}
                                                id={`select_${index}`}
                                                defaultValue={elem.contract}
                                            >
                                                {
                                                    // добавление опций в селект
                                                    cryptoCurrencies.map((elem, index) =>
                                                        <option
                                                            value={elem.contract}
                                                            key={index}
                                                        >
                                                            {
                                                                elem.name
                                                            }
                                                        </option>
                                                    )
                                                }
                                            </select>
                                        </div>
                                    </th>
                                    <th>
                                        {/*инпут для ввода адреса*/}
                                        <input
                                            onChange={onChangeHandler}
                                            id={`input2_${index}`}
                                            style={{width: 350}}
                                            defaultValue={elem.address}
                                        />
                                    </th>
                                    <th>
                                        {/*баланс*/}
                                        {elem.balance}
                                    </th>
                                </tr>
                            ))
                        }
                        </tbody>
                        <tfoot>
                        <tr>
                            <th>
                                {/*кнопка добавления новой строки*/}
                                <button onClick={onClickAddRow}>Add new row</button>
                            </th>
                            <th>
                                {/*кнопка получения баланса*/}
                                <button onClick={onClickGetBalance}>Get balances</button>
                            </th>
                            <th>
                                {/*кнопка выгрузки csv*/}
                                <button onClick={() => {
                                    //бежим по балансу и добавлем нужные ключи в выгрузку
                                    setCsvData(Array(balances.length))
                                    balances.forEach((elem, index) =>
                                        csvData[index] = {name: elem.name, address: elem.address, balance: elem.balance}
                                    )
                                    setCsvData([...csvData])
                                }}
                                >
                                    <CSVLink data={csvData} filename={"balances.csv"}>Download CSV</CSVLink>
                                </button>
                            </th>
                        </tr>
                        </tfoot>
                    </table>
                }
            </header>
        </div>
    );
}

export default App;
