import React, { useState } from 'react';
import './vault.css';

export const Card = ({ item }) => {
    const [collapsed, setCollapsed] = useState(true);

    const toggleDropdown = () => {
        setCollapsed(!collapsed);
    };

    return (
        <div className="col-xl-4 offset-xl-0 info-sub-div">
            <div style={{ textAlign: "center" }}>
                <img src={item.image} style={{ width: "187px" }} alt={item.name} />
            </div>
            <div className={`dropdown menu_links ${collapsed ? '' : 'show'}`} style={{ textAlign: "center" }}>
                <button
                    className="btn btn-primary dropdown-toggle vault-metadata"
                    aria-expanded={!collapsed}
                    onClick={toggleDropdown}
                    type="button"
                >
                    {item.name}
                </button>
                <div className={`dropdown-menu vault-menulink ${collapsed ? '' : 'show'}`}>
                    {Array.isArray(item.attributes) && item.attributes.map((attr, i) => (
                        <li
                            key={i}
                            className="list-group-item d-flex align-items-center"
                            style={{ background: "rgba(255,255,255,0)" }}
                        >
                            <a className="dropdown-item vault-example" href="#">
                                <p style={{ margin: "0" }}>{attr.trait_type} : {attr.value}</p>
                            </a>
                        </li>
                    ))}
                </div>
            </div>
        </div>
    );
};