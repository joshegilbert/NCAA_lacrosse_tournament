/**
 * Points per correct pick by scoring tier.
 * Opening + first round matchups both use `firstRound` in the database.
 */
module.exports = {
  firstRound: 1,
  quarterfinal: 2,
  semifinal: 4,
  championship: 8,
}
