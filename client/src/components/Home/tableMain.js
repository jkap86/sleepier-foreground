import './css/tableMain.css';
import { avatar } from '../Functions/misc';

import Search from './search';

const TableMain = ({ id, type, headers, body, page, setPage, itemActive, setItemActive, caption, search, searched, setSearched, options }) => {

    const body_filtered = searched === '' || !searched ?
        body
        :
        body.filter(x => x.search?.text === searched.text)


    return <>
        {
            search ?
                <div>
                    <Search
                        id={id}
                        sendSearched={(data) => setSearched(data)}
                        placeholder={`Search ${id}`}
                        list={body.map(b => {
                            return b.search
                        })}
                    />
                </div>
                :
                null
        }
        {

            page ?
                <div className="page_numbers_wrapper">
                    <>
                        {
                            (Math.ceil(body_filtered.length / 25) <= 1) ? null :
                                <ol className="page_numbers">
                                    {Array.from(Array(Math.ceil(body_filtered.length / 25)).keys()).map(page_number =>
                                        <li className={page === page_number + 1 ? 'active click' : 'click'} key={page_number + 1} onClick={() => setPage(page_number + 1)}>
                                            {page_number + 1}
                                        </li>
                                    )}
                                </ol>
                        }
                        {
                            options ?
                                <div className='options'>
                                    {options[0]}
                                </div>
                                : null
                        }
                    </>
                </div>
                : null
        }


        <table className={type}>
            {
                caption ?
                    <caption>
                        {caption}
                    </caption>
                    : null
            }
            <thead>
                {
                    headers?.map((header, index) =>
                        <tr key={index}>
                            {
                                header.filter(x => x).map((key, index) =>
                                    <th
                                        key={index}
                                        colSpan={key?.colSpan}
                                        rowSpan={key?.rowSpan}
                                        className={key?.className}
                                        onClick={key?.onClick}
                                    >
                                        {
                                            key?.text
                                        }
                                    </th>
                                )
                            }
                        </tr>
                    )
                }
            </thead>
            {
                !(page > 1) ? null :
                    <tbody>
                        <tr
                            className={'click'}
                            onClick={() => setPage(prevState => prevState - 1)}
                        >
                            <td colSpan={headers[0].reduce((acc, cur) => acc + (cur.colSpan || 0), 0)}>PREV PAGE</td>
                        </tr>
                    </tbody>

            }
            {
                body?.length > 0 ?
                    <tbody
                    >
                        {
                            body_filtered
                                ?.filter(x => x)
                                ?.slice(Math.max(((page || 1) - 1) * 25, 0), (((page || 1) - 1) * 25) + 25)
                                ?.map((item, index) =>

                                    <tr key={index} className={`${type}_wrapper ${itemActive === item.id ? 'active' : ''}`}>
                                        <td
                                            colSpan={item.list.reduce((acc, cur) => acc + (cur.colSpan || 0), 0)}
                                        >
                                            <table className={`${type}_body`}>
                                                <tbody>
                                                    <tr
                                                        className={`${type} click ${itemActive === item.id ? 'active' : ''} ${index === 0 ? 'sticky' : ''}`}
                                                        onClick={setItemActive ? () => setItemActive(prevState => prevState === item.id ? '' : item.id) : null}
                                                    >
                                                        {
                                                            item.list
                                                                .filter(x => x.text)
                                                                .map((key, index) =>
                                                                    <td
                                                                        key={index}
                                                                        colSpan={key.colSpan}
                                                                        className={key.className}
                                                                    >
                                                                        {
                                                                            key.image ?
                                                                                <p>
                                                                                    {
                                                                                        avatar(
                                                                                            key.image.src, key.image.alt, key.image.type
                                                                                        )
                                                                                    }
                                                                                    <span>{key.text}</span>
                                                                                </p>
                                                                                :
                                                                                key.text
                                                                        }
                                                                    </td>
                                                                )
                                                        }
                                                    </tr>
                                                </tbody>
                                                <tbody>
                                                    {
                                                        (itemActive !== item.id || !item.secondary_table) ? null :
                                                            <tr className={`${type}2 click ${itemActive === item.id ? 'active' : ''}`}
                                                            >
                                                                <td colSpan={item.list.reduce((acc, cur) => acc + cur.colSpan, 0)}>
                                                                    {item.secondary_table}
                                                                </td>
                                                            </tr>
                                                    }
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>

                                )

                        }
                    </tbody>
                    :
                    <tbody>
                        <tr>
                            <td
                                colSpan={headers[0]?.reduce((acc, cur) => acc + (cur?.colSpan || 0), 0)}
                            >
                                NO DATA
                            </td>
                        </tr>
                    </tbody>
            }
            {
                (((page - 1) * 25) + 25) < body_filtered?.length ?
                    <tbody>
                        <tr
                            className={'click'}
                            onClick={() => setPage(prevState => prevState + 1)}
                        >
                            <td colSpan={headers[0].reduce((acc, cur) => acc + (cur.colSpan || 0), 0)}>NEXT PAGE</td>
                        </tr>
                    </tbody>
                    :
                    null
            }
        </table>
    </>
}

export default TableMain;