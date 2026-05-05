/**
 * Register all Mongoose models on the default connection so populate()
 * can resolve refs (e.g. Matchup → Team) even if a route never required Team.
 */
require('./User')
require('./Team')
require('./Matchup')
require('./League')
require('./BracketEntry')
require('./LeagueMatchupResult')
