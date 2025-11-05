import React from "react";
import { RefreshControl, RefreshControlProps } from "react-native";
import { colors } from "../../theme";

interface PullToRefreshProps extends Partial<RefreshControlProps> {
  refreshing: boolean;
  onRefresh: () => void;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  refreshing,
  onRefresh,
  ...props
}) => {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[colors.primary]}
      tintColor={colors.primary}
      progressBackgroundColor={colors.white}
      {...props}
    />
  );
};
