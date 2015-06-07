class JS {
    static event(eventType, eventData) {
        var js = "wrenSpawnEvent('" + eventType + "', '" + eventData + "');"
        run(js)
    }

    foreign static run(string)
    foreign static getString(string)
    foreign static getInt(string)
}
