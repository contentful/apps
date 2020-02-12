import React from 'react';
import { CheckboxField, TextInput, Pill, Button } from '@contentful/forma-36-react-components';
import get from 'lodash.get';

import { styles } from './styles';

async function callAPI(url) {
  const res = await fetch(`/tags/${url}`);
  const data = await res.json();
  return data.tags;
}

export class AITagView extends React.Component {

  constructor(props){
    super(props);

    this.state = {
      value: "",
      checked: false,
      tags: props.entries.imageTags.getValue() || [],
      overwrite: true,
      isMissingImage: !props.entries.image.getValue(),
      isFetchingTags: false
    }
  }

  componentDidMount() {
    this.props.entries.image.onValueChanged(() => {
      this.setState(() => ({
        isMissingImage: !this.props.entries.image.getValue()
      }))
    });
  }

  toggleOverwrite = () => {
    this.setState(state => ({
      overwrite: !state.overwrite
    }));
  }

  addTag = async (e) => {
    if (e.key !== "Enter" || !e.target.value) { return; }

    const newTags = [e.target.value, ...this.state.tags];
    await this.props.entries.imageTags.setValue(newTags);
    this.setState({
      tags: newTags,
      value: ""
    });
  }

  deleteTag = async (tag) => {
    const newTags = this.state.tags.filter(t => t !== tag);
    await this.props.entries.imageTags.setValue(newTags);
    this.setState({
      tags: newTags
    });
  }

  fetchTags =  async () => {
    const imageId = get(this.props.entries.image.getValue(), 'sys.id')
    const file = await this.props.space.getAsset(imageId);
    const locale = this.props.locale;
    const fullURL = get(file, `fields.file.${locale}.url`);
    const imagePath = new URL(`${location.protocol}${fullURL}`).pathname;
    this.setState({ isFetchingTags: true });

    try {
      const aiTags = await callAPI(imagePath);

      // upload new tags
      const newTags = this.state.overwrite ? aiTags : [...aiTags, ...this.state.tags];
      await this.props.entries.imageTags.setValue(newTags)
      this.setState({
        tags: newTags
      });
    } catch(e) {
      this.props.notifier.error("Image Tagging failed. Please try again later.")
    } finally {
      this.setState({ isFetchingTags: false });
    }
  }

  updateValue = (e) => {
    this.setState({
      value: e.target.value
    });
  }

  render() {
    return <div>
      <TextInput
        testId="image-tag"
        placeholder="Type a tag and press enter"
        width="large"
        disabled={ this.state.isMissingImage }
        value={ this.state.value }
        onChange={ this.updateValue }
        onKeyPress={ this.addTag }
      />
      <div className={ styles.pillWrapper }>
        { 
          this.state.tags.map((tag, index) => (
            <Pill
              className={ styles.pill }
              key={`${tag}-${index}`}
              label={ tag }
              onClose={ this.deleteTag.bind(this, tag) }
            />
          ))
        }
      </div>
      <Button
        id="fetch-tag-btn"
        className={ styles.btn }
        buttonType="primary"
        type="button"
        disabled={ this.state.isMissingImage }
        loading={ this.state.isFetchingTags }
        onClick={ this.fetchTags }
      >
        Auto-tag from AI
      </Button>
      <CheckboxField
        id={`overwrite-tags`}
        labelText={ "Overwrite existing tags" }
        disabled={ this.state.isMissingImage }
        checked={ this.state.overwrite }
        onChange={ this.toggleOverwrite }
      />
    </div>
  }
}
