import React from 'react';
import './info.css';

// Simple counter using React Hooks
export const Info = () => {

    return (
        <section className="main-section">
            <div className="row mr-0">
                <div className="col-xl-6 offset-xl-3 info-sub-div">
                    <div className="card info-card-bg">
                        <div className="card-body info-card-body">
                            <h1 className='info-text'>A quick and easy way to exchange Current&trade; and USGold&reg;.</h1>
                            <p className='info-text'>Utilities
                            This allows conversions to Current for use on exchanges, and everyday use with your Current Gold Card. This also allows conversion to USG to redeem for the 1 oz. gold American Eagle coins.
                                <br /><br /></p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};