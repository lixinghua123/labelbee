import { IPointCloudBox, IPointCloudBoxList, IPointCloudConfig } from '@labelbee/lb-utils';
import { useCallback, useContext, useMemo, useState } from 'react';
import _ from 'lodash';
import { message } from 'antd';
import { usePointCloudViews } from './usePointCloudViews';
import { PointCloudContext } from '../PointCloudContext';
import { useTranslation } from 'react-i18next';
import { EPointCloudBoxRenderTrigger } from '@/utils/ToolPointCloudBoxRenderHelper';
import AnnotationDataUtils from '@/utils/AnnotationDataUtils';
import { IFileItem } from '@/types/data';
import { uuid } from '@labelbee/lb-annotation';
import { useHistory } from './useHistory';
import { generatePointCloudBoxRects } from '@/utils';

/**
 * For each `rect`, the value of `imageName` on the paste page should be calculated from the value on the copy page using `getNextPath` in `AnnotationDataUtils`.
 * When a box with 2D rects having image names like "1_a.png" and "1_b.png" is copied on page 1 and pasted on page 10, the rects' image names should be updated to "10_a.png" and "10_b.png" respectively to match the images on page 10.
 * Filters out any `rect` objects that have an empty `imageName`.
 *
 * @param {IPointCloudBox} box - The point cloud box containing the rects array to be updated.
 * @returns {IPointCloudBox} - A new point cloud box object with the updated rects array.
 */
const updateBoxRects = (
  box: IPointCloudBox,
  mappingImgList: IFileItem['mappingImgList'] = [],
  preMappingImgList: IFileItem['mappingImgList'] = [],
) => {
  const { rects = [] } = box;

  const newRects = rects
    .map((rect) => ({
      ...rect,
      imageName:
        AnnotationDataUtils.getNextPath({
          prePath: rect.imageName,
          preMappingImgList,
          nextMappingImgList: mappingImgList,
        }) ?? '',
    }))
    .filter((rect) => rect.imageName !== '');

  return {
    ...box,
    rects: newRects,
  };
};

// Update the Id of the copied box
const updateCopiedBoxesId = (
  pointCloudBoxList: IPointCloudBoxList,
  copiedBoxes: IPointCloudBoxList,
) => {
  // View the ID of the largest box
  const maxTrackID = Math.max(...pointCloudBoxList.map((item) => item.trackID || 0), 0);
  const positionValue = 0.2;

  return copiedBoxes.map((item, index) => {
    return {
      ...item,
      id: uuid(),
      uuid: uuid(),
      center: {
        x: item.center.x - positionValue * 5,
        y: item.center.y + positionValue,
        z: item.center.z,
      },
      trackID: maxTrackID + index + 1,
    };
  });
};

/**
 * Actions for selected boxes
 */
export const useBoxes = ({
  config,
  currentData,
}: {
  config: IPointCloudConfig;
  currentData: IFileItem;
}) => {
  const {
    selectedIDs,
    pointCloudBoxList,
    displayPointCloudList,
    setPointCloudResult,
    syncAllViewPointCloudColor,
    imageSizes,
  } = useContext(PointCloudContext);

  const [copiedParams, setCopiedParams] = useState<{
    copiedBoxes: IPointCloudBoxList;
    copiedMappingImgList: IFileItem['mappingImgList'];
  }>({
    copiedBoxes: [],
    copiedMappingImgList: [],
  });

  const { copiedBoxes } = copiedParams;

  const { pointCloudBoxListUpdated } = usePointCloudViews();
  const { t, i18n } = useTranslation();
  const { pushHistoryWithList } = useHistory();

  const selectedBoxes = useMemo(() => {
    return displayPointCloudList.filter((i) => selectedIDs.includes(i.id));
  }, [selectedIDs, displayPointCloudList]);

  const copySelectedBoxes = useCallback(() => {
    if (selectedBoxes.length > 0) {
      const mappingImgList = currentData?.mappingImgList ?? [];
      setCopiedParams({
        copiedBoxes: _.cloneDeep(selectedBoxes),
        copiedMappingImgList: mappingImgList,
      });
    } else {
      setCopiedParams({
        copiedBoxes: [],
        copiedMappingImgList: [],
      });
      message.error(t('CopyEmptyInPointCloud'));
    }
    message.success(t('CopySuccess'));
  }, [selectedIDs, displayPointCloudList, i18n.language, currentData]);

  const pasteSelectedBoxes = useCallback(() => {
    if (copiedBoxes.length === 0) {
      message.error(t('PasteEmptyInPointCloud'));
      return;
    }

    const mappingImgList = currentData?.mappingImgList ?? [];
    const preMappingImgList = copiedParams?.copiedMappingImgList ?? [];

    const newCopiedBoxes = copiedBoxes.map((box) =>
      updateBoxRects(box, mappingImgList, preMappingImgList),
    );

    // Get the box with the latest updated ID
    const pastedBoxes = updateCopiedBoxesId(displayPointCloudList, newCopiedBoxes);

    // Update the results of all point cloud 3D frames
    const updatePointCloudResult = (newPointCloudBoxList: IPointCloudBoxList) => {
      setPointCloudResult(newPointCloudBoxList);
      pointCloudBoxListUpdated?.(newPointCloudBoxList);
      setCopiedParams({
        copiedBoxes: [],
        copiedMappingImgList: [],
      });

      /**
       * Update the data in the historical data stack to ensure data synchronization.
       * To solve the problem of dragging A to highlight the color without updating when copying and pasting an A1
       */
      pushHistoryWithList({
        pointCloudBoxList: newPointCloudBoxList,
      });

      syncAllViewPointCloudColor(EPointCloudBoxRenderTrigger.MultiPaste, newPointCloudBoxList);
    };

    const newPointCloudResult = [...displayPointCloudList, ...pastedBoxes];

    /**
     * Synchronize the values of rects in the latest 3D point cloud list
     * which have a direct impact on 2D views
     */
    newPointCloudResult.forEach((pointCloudBox) =>
      generatePointCloudBoxRects({
        pointCloudBox,
        mappingImgList,
        imageSizes,
      }),
    );

    updatePointCloudResult(newPointCloudResult);
  }, [copiedBoxes, displayPointCloudList, i18n.language, currentData]);

  return { copySelectedBoxes, pasteSelectedBoxes, copiedBoxes, selectedBoxes };
};
