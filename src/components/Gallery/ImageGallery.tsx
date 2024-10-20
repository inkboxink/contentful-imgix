import { DialogExtensionSDK } from 'contentful-ui-extensions-sdk';
import { Component } from 'react';

import { AssetProps, PageProps, SourceProps } from '../Dialog';
import { GridImage, GalleryPlaceholder } from './';

import { ActionBar } from '../ActionBar';
import './ImageGallery.css';
import { stringifyJsonFields } from '../../helpers/utils';

interface GalleryProps {
  selectedSource: Partial<SourceProps>;
  sdk: DialogExtensionSDK;
  pageInfo: PageProps;
  changePage: (newPageIndex: number) => void;
  assets: AssetProps[];
  loading: boolean;
}

interface GalleryState {
  selectedAsset: AssetProps | undefined;
}

export class Gallery extends Component<GalleryProps, GalleryState> {
  constructor(props: GalleryProps) {
    super(props);

    this.state = {
      selectedAsset: undefined,
    };
  }

  /**
   * Fetches an Object of asset metadata, like width and height attributes.
   */
  getAssetMetadata = async (assetURL: string): Promise<Record<string, any>> => {
    try {
      const response = await fetch(`${assetURL.split('?')[0]}?fm=json`);
      return await response.json();
    } catch (error) {
      return {};
    }
  };

  handleClick = (selectedAsset: AssetProps) => this.setState({ selectedAsset });

  handleSubmit = async () => {
    if (!this.state.selectedAsset?.src) {
      return;
    }

    // add metadata to selectedAsset attributes
    const metadata = await this.getAssetMetadata(this.state.selectedAsset.src);
    const selectedAsset = { ...this.state.selectedAsset };

    if (!selectedAsset.attributes.media_width) {
      selectedAsset.attributes.media_width = metadata?.PixelWidth || '';
    }

    if (!selectedAsset.attributes.media_height) {
      selectedAsset.attributes.media_height = metadata?.PixelHeight || '';
    }

    const stringifiedAsset = {
      ...stringifyJsonFields(selectedAsset, [
        'attributes.custom_fields',
        'attributes.tags',
        'attributes.colors.dominant_colors',
      ]),
    };

    // INKBOX NOTE: ignore the asset because we need it in our format
    // [ { original_url: url } ]

    this.props.sdk.close([
      {original_url: selectedAsset.src,}
    ]);
  };

  handleClose = () => {
    this.props.sdk.close();
  };

  componentDidUpdate(prevProps: GalleryProps) {
    if (prevProps.selectedSource.id !== this.props.selectedSource.id) {
      this.setState({
        selectedAsset: undefined,
      });
    }
  }

  render() {
    const { selectedAsset } = this.state;
    const previouslySelectedSource = (
      this.props.sdk.parameters.invocation as any
    )?.selectedImage?.selectedSource;

    // If replacing an image or `loading` is true
    if (
      (previouslySelectedSource &&
        previouslySelectedSource.id === this.props.selectedSource.id &&
        !this.props.assets.length) ||
      this.props.loading
    ) {
      return (
        <GalleryPlaceholder
          handleClose={this.handleClose}
          sdk={this.props.sdk}
          text="Loading"
        />
      );
    }

    // If no asset in state
    if (!this.props.assets.length) {
      // If a source hasn't been selected
      return !this.props.selectedSource.type ? (
        <GalleryPlaceholder
          sdk={this.props.sdk}
          handleClose={this.handleClose}
          text={
            // @ts-ignore
            this.props.sdk.parameters.installation.sourceID
              ? 'Loading'
              : 'Select a Source to view your image gallery'
          }
        />
      ) : // If the source is a webfolder
      this.props.selectedSource.type === 'webfolder' ? (
        <GalleryPlaceholder
          sdk={this.props.sdk}
          handleClose={this.handleClose}
          text="Select a different Source to view your visual media."
        />
      ) : (
        // If the source is empty
        <GalleryPlaceholder
          sdk={this.props.sdk}
          handleClose={this.handleClose}
          text="Add assets to this Source by selecting Upload."
        />
      );
    }

    return (
      <>
        <div className="ix-gallery">
          {this.props.assets.map((asset) => {
            return (
              <GridImage
                key={asset.src}
                selected={selectedAsset?.src === asset.src}
                asset={asset}
                handleClick={() => this.handleClick(asset)}
              />
            );
          })}
        </div>
        <ActionBar
          assets={this.props.assets}
          selectedSource={this.props.selectedSource}
          handleSubmit={this.handleSubmit}
          selectedAsset={selectedAsset}
          pageInfo={this.props.pageInfo}
          changePage={this.props.changePage}
          handleClose={this.handleClose}
        />
      </>
    );
  }
}
