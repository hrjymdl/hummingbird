const Track = ({albumCoverURL, trackName, artistNames, albumName}) => {
    return (
                <div className="track-section-outer" >
                    <div className="track-section">
                        <div className="album-art-container" style={{backgroundImage: `url(${albumCoverURL})`}}>
                            <img className='album-art' alt="some text" src={albumCoverURL} />
                        </div>
                        <div className="track-info">
                            <div className="track-info-all">
                            
                                <div className="track-details">
                                <span className="track-name">{trackName}</span>

                                    <span className="artist-name">{artistNames}</span>
                                    <span className="album-name">{albumName}</span>
                                </div>
                            </div>
                        </div>
                    </div>           
                </div>
    )
}

export default Track
