describe('suite', function () {
  it('succeeds', function () {
    expect(true).to.be.true()
  })

  it.skip('gets skipped', function () {

  })

  it('times out', function (done) {
    this.timeout(1)
  })

  it('fails', function () {
    expect(true).to.be.false()
  })
})
