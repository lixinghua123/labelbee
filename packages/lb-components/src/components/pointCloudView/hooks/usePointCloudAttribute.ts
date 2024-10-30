import { useContext } from 'react';
import { PointCloudContext } from '../PointCloudContext';
import { useUpdatePointCloudColor } from './useUpdatePointCloudColor';
import { useAttribute } from './useAttribute';
import { usePolygon } from './usePolygon';
import { useLine } from './useLine';
import { useSphere } from './useSphere';
import { useHistory } from './useHistory';
import { usePointCloudViews } from './usePointCloudViews';

export const usePointCloudAttribute = (setResourceLoading: any, config: any) => {
  const { updatePointCloudColor } = useUpdatePointCloudColor(setResourceLoading, config);
  const { syncThreeViewsAttribute } = useAttribute();
  const { selectedPolygon } = usePolygon();
  const { selectedLine } = useLine();
  const { selectedSphere } = useSphere();
  const { updatePointCloudSphere } = useSphere();
  const { pushHistoryUnderUpdatePolygon, pushHistoryUnderUpdateLine } = useHistory();
  const { topViewSelectedChanged } = usePointCloudViews();
  const ptCtx = useContext(PointCloudContext);

  const updatePointCloudAttribute = (newAttribute: string) => {
    syncThreeViewsAttribute(newAttribute);

    /**
     * The logic for extracting the updated color of the original point cloud due to changes in the main attribute,
     * which originally only supported single selection, now supports multiple selection, and merges to reduce the number of updates
     */
    updatePointCloudColor(newAttribute);

    if (selectedPolygon) {
      pushHistoryUnderUpdatePolygon({ ...selectedPolygon, attribute: newAttribute });
    }
    if (selectedLine) {
      pushHistoryUnderUpdateLine({ ...selectedLine, attribute: newAttribute });
    }
    if (selectedSphere) {
      const newSphereList = updatePointCloudSphere({
        ...selectedSphere,
        attribute: newAttribute,
      });
      if (ptCtx.mainViewInstance) {
        ptCtx.mainViewInstance?.generateSpheres(newSphereList);
        topViewSelectedChanged({
          newSelectedSphere: selectedSphere,
          newSphereList: newSphereList,
        });
      }
    }
  };

  return {
    updatePointCloudAttribute,
  };
};
