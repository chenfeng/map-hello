import extend from 'lodash/extend';

class Event {
  constructor(type, data = {}) {
    extend(this, data);
    this.type = type;
  }
}

export default Event;
