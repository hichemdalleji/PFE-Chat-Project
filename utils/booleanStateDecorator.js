/**
 * Add a boolean state value to the component state and add a switch state to the component
 * Because the decorator doesn't allow arguments, this method is actually a decorator factory function.
 * @param {Object} values key:State key name value: state default value
 */
export default function booleanStateDecorator(values) {
    return function (target) {
        class BooleanStateDecoratorWrap extends target {
            constructor(...args) {
                super(...args);
                this.state = this.state || {};

                for (const key in values) {
                    // Ignore non-boolean types
                    if (typeof values[key] !== 'boolean') {
                        return;
                    }

                    this.state[key] = values[key];
                    const upperKey = key[0].toUpperCase() + key.substr(1);
                    this[`toggle${upperKey}`] = (value) => {
                        if (typeof value === 'boolean') {
                            this.setState({ [key]: value });
                        } else {
                            this.setState({ [key]: !this.state[key] });
                        }
                    };
                }
            }
            render() {
                return super.render();
            }
        }
        return BooleanStateDecoratorWrap;
    };
}
