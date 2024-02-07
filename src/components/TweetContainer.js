import Track from "./Track"
const TweetContainer = ({track}, {key}) => {
    return (
        <div className="tweet-container">
            <div className="tweet-left-section">
            <div className="profile-photo-section">
                <img className='profile-photo' alt="some-text" src={track['tweetProfilePhoto']} />
                <div className='line'></div>
            </div>
            </div>
            <div className="tweet-section-gap">
                
            </div>
            <div className="tweet-right-section">
                <div className="user-info">
                    <div className="user-info-group">
                        <span className="user-nick-name">{track['tweetAuthorName']}</span>
                        <span className="user-name">@{track['tweetAuthorUsername']}</span>
                    </div>
                </div>
            {track['tweetText'].length > 0 &&
                <div className="tweet-text-section">
                    <div className="tweet-text-container">
                        <p className="tweet-text">
                        {track['tweetText']}
                        </p>
                    </div>

                </div>
            }
                <Track 
                    albumCoverURL={track['albumCoverURL']}
                    trackName={track['trackName']}
                    artistNames={track['artistNames']}
                    albumName={track['albumName']}
                />     
            </div>
        </div>
    )
}

export default TweetContainer
